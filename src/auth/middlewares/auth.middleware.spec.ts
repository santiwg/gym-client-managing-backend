import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { AuthGuard } from './auth.middleware';
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from '../users/users.service';

// Pruebas unitarias para AuthGuard (middleware de autorización)
// Objetivo: validar el flujo de autenticación y autorización por permisos
// - Lee el header Authorization y extrae el Bearer token
// - Decodifica el token (JwtService.getPayload)
// - Busca el usuario por email (UsersService.findByEmail)
// - Inyecta request.user
// - Verifica permisos declarados en el handler (Reflector + UsersService.canDo)
// - Errores (falta de token, token inválido, falta de permisos) => UnauthorizedException

describe('AuthGuard (unit)', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;
  let reflector: jest.Mocked<Reflector>;

  // Crea un ExecutionContext mínimo con un request y un handler ficticio
  const createContext = (headers: Record<string, string> = {}): { ctx: ExecutionContext; req: any } => {
    const req: any = { headers };
    const handler = function handler() {};
    const http = { getRequest: () => req };
    const ctx: Partial<ExecutionContext> = {
      switchToHttp: () => http as any,
      getHandler: () => handler as any,
      getClass: () => ({} as any),
    };
    return { ctx: ctx as ExecutionContext, req };
  };

  beforeEach(() => {
    jwtService = {
      generateToken: jest.fn(),
      getPayload: jest.fn(),
      refreshToken: jest.fn() as any,
      config: { auth: { secret: 's', expiresIn: '15m' }, refresh: { secret: 'r', expiresIn: '1d' } },
    } as any;

    usersService = {
      findByEmail: jest.fn(),
      canDo: jest.fn(),
    } as any;

    reflector = {
      get: jest.fn(),
    } as any;

    guard = new AuthGuard(jwtService as any, usersService as any, reflector as any);
  });

  it('falta Authorization: lanza Unauthorized con mensaje específico', async () => {
    reflector.get.mockReturnValue([]); // sin permisos requeridos
    const { ctx } = createContext({}); // Falta el header Authorization con el Bearer token en la request
    
    const p = guard.canActivate(ctx);
    await expect(p).rejects.toBeInstanceOf(UnauthorizedException);
    await p.catch(e => expect(String(e.message)).toContain('El token no existe'));
    expect(jwtService.getPayload).not.toHaveBeenCalled();
    expect(usersService.findByEmail).not.toHaveBeenCalled();
  });

  it('token válido y sin permisos requeridos: permite y setea request.user', async () => {
    reflector.get.mockReturnValue([]);
    jwtService.getPayload.mockReturnValue({ email: 'user@example.com', exp: Math.floor(Date.now() / 1000) + 60 } as any);
    usersService.findByEmail.mockResolvedValue({ id: 1, email: 'user@example.com' } as any);

    const { ctx, req } = createContext({ authorization: 'Bearer token-123' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(jwtService.getPayload).toHaveBeenCalledWith('token-123');
    expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(req.user).toEqual({ id: 1, email: 'user@example.com' });
    expect(usersService.canDo).not.toHaveBeenCalled();
  });

  it('con permisos requeridos y canDo=true para todos: permite', async () => {
    const required = ['perm.read', 'perm.write'];
    reflector.get.mockReturnValue(required);
    jwtService.getPayload.mockReturnValue({ email: 'user@example.com', exp: Math.floor(Date.now() / 1000) + 60 } as any);
    usersService.findByEmail.mockResolvedValue({ id: 1, email: 'user@example.com' } as any);
    usersService.canDo.mockReturnValue(true);

    const { ctx } = createContext({ authorization: 'Bearer abc' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(usersService.canDo).toHaveBeenCalledTimes(required.length);
    expect(usersService.canDo).toHaveBeenCalledWith({ id: 1, email: 'user@example.com' }, 'perm.read');
    expect(usersService.canDo).toHaveBeenCalledWith({ id: 1, email: 'user@example.com' }, 'perm.write');
  });

  it('falta un permiso: termina en Unauthorized (mensaje de Forbidden propagado)', async () => {
    reflector.get.mockReturnValue(['perm.admin']);
    jwtService.getPayload.mockReturnValue({ email: 'user@example.com', exp: Math.floor(Date.now() / 1000) + 60 } as any);
    usersService.findByEmail.mockResolvedValue({ id: 1, email: 'user@example.com' } as any);
    usersService.canDo.mockReturnValue(false);

    const { ctx } = createContext({ authorization: 'Bearer abc' });
    const p = guard.canActivate(ctx);
    await expect(p).rejects.toBeInstanceOf(UnauthorizedException);
    // El guard lanza Forbidden, pero lo captura y re-lanza como Unauthorized con el mismo mensaje
    await p.catch(e => expect(String(e.message)).toContain('Not enough permissions'));
  });

  it('token inválido: Unauthorized con mensaje del error subyacente', async () => {
    reflector.get.mockReturnValue([]);
    jwtService.getPayload.mockImplementation(() => { throw new Error('bad token'); });
    const { ctx } = createContext({ authorization: 'Bearer invalid' });
    const p = guard.canActivate(ctx);
    await expect(p).rejects.toBeInstanceOf(UnauthorizedException);
    await p.catch(e => expect(String(e.message)).toContain('bad token'));
  });

  it('findByEmail falla: Unauthorized', async () => {
    reflector.get.mockReturnValue([]);
    jwtService.getPayload.mockReturnValue({ email: 'missing@example.com', exp: Math.floor(Date.now() / 1000) + 60 } as any);
    usersService.findByEmail.mockRejectedValue(new Error('user not found'));
    const { ctx } = createContext({ authorization: 'Bearer t' });
    const p = guard.canActivate(ctx);
    await expect(p).rejects.toBeInstanceOf(UnauthorizedException);
    await p.catch(e => expect(String(e.message)).toContain('user not found'));
  });
});
