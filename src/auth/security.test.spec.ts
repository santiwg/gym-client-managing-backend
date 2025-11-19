/**
 *
 * Alcance de UNIT tests:
 * - No hay DB real. Mockeamos Repository<User>, JwtService y RolesService.
 * - Probamos cada método en aislamiento, controlando outputs y llamadas a mocks.
 */

import { UnauthorizedException, NotFoundException, HttpException } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { JwtService } from './jwt/jwt.service';
import { RolesService } from './roles/roles.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { hashSync } from 'bcrypt';

// Utilidad para crear un mock de repositorio TypeORM con los métodos usados
function createUserRepoMock() {
  return {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    // query: método crudo de TypeORM; NO debería usarse en UsersService
    query: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;
}

// Mocks básicos de dependencias
function createJwtMock() {
  return {
    generateToken: jest.fn().mockReturnValue('mock.jwt.token'),
    refreshToken: jest.fn().mockResolvedValue('mock.refresh.token'),
  } as unknown as jest.Mocked<JwtService>;
}

function createRolesServiceMock() {
  return {
    hasPermission: jest.fn().mockReturnValue(true),
    findRoleByName: jest.fn().mockResolvedValue({ id: 1, name: 'user' } as any),
  } as unknown as jest.Mocked<RolesService>;
}

describe('UsersService security', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;
  let jwt: jest.Mocked<JwtService>;
  let roles: jest.Mocked<RolesService>;

  beforeEach(() => {
    jest.restoreAllMocks();
    repo = createUserRepoMock();
    jwt = createJwtMock();
    roles = createRolesServiceMock();
    service = new UsersService(jwt, repo, roles);
  });

  describe('SQL Injection en login/findByEmail', () => {
    it('rechaza email con patrón de inyección (no devuelve usuario y lanza Unauthorized)', async () => {
      // Simulamos un input malicioso típico de inyección
      const injectionEmail = "' OR 1=1; --";

      // El repo debería devolver undefined ya que no coincidirá con un email válido
      repo.findOneBy.mockResolvedValue(undefined as any);

      await expect(service.login({ email: injectionEmail, password: 'x' })).rejects.toBeInstanceOf(UnauthorizedException);

      // validamos que NO se usó `query` (consulta cruda no parametrizada) y en camio usó la API segura
      expect(repo.query).not.toHaveBeenCalled();
      expect(repo.findOneBy).toHaveBeenCalledWith({ email: injectionEmail });
    });

    //Este test sigue la misma estructura que el anterior
    it('rechaza email con inyección en findByEmail (Unauthorized) sin usar consultas crudas', async () => {
      const injectionEmail = "admin@example.com' UNION SELECT * FROM users --";
      repo.findOneBy.mockResolvedValue(undefined as any);

      await expect(service.findByEmail(injectionEmail)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repo.query).not.toHaveBeenCalled();
      expect(repo.findOneBy).toHaveBeenCalledWith({ email: injectionEmail });
    });
  });

  //Este test sigue la misma estructura que el anterior
  describe('SQL Injection en findById/assignRole', () => {
    it('findById con id malicioso no ejecuta DDL ni SELECT masivo (NotFound)', async () => {
      // Simulamos un id "malicioso" como string aunque el método espera number. En tiempo de ejecución, si el controlador NO usa ParseIntPipe, Nest entrega el parámetro como string (p. ej., "1; DROP TABLE users; --").
      const dangerousId: any = '1; DROP TABLE users; --';
      repo.findOne.mockResolvedValue(null as any);

      await expect(service.findById(dangerousId)).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.query).not.toHaveBeenCalled();
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: dangerousId } });
    });

    /*
    it('assignRole con roleName malicioso invoca RolesService de forma segura', async () => {
      const user: User = { id: 10, email: 'u@e.com', password: 'h', createdAt: undefined, updatedAt: undefined } as any;
      // findById: devolver un usuario real
      repo.findOne.mockResolvedValue(user as any);
      // rolesService.findRoleByName devuelve un rol válido, aunque el input sea extraño
      (roles.findRoleByName as jest.Mock).mockResolvedValue({ id: 2, name: "admin" });
      // save devuelve el usuario con rol actualizado
      repo.save.mockResolvedValue({ ...user, role: { id: 2, name: 'admin' } } as any);

      const roleName = "admin'; DROP SCHEMA public CASCADE; --";
      const result = await service.assignRole(10, { roleName });

      expect(roles.findRoleByName).toHaveBeenCalledWith(roleName);
      expect(repo.save).toHaveBeenCalled();
      expect(repo.query).not.toHaveBeenCalled();
      expect(result.role).toEqual({ id: 2, name: 'admin' });
    });
    */
  });

  //Estructura similar a las pruebas anteriores
  describe('SQL Injection en register', () => {
    it('register con campos maliciosos guarda el usuario sin ejecutar SQL crudo', async () => {
      // Campos con intento de inyección dentro de strings
      const body = {
        email: "new@example.com'; DROP TABLE users; --",
        password: "p4ssw0rd' OR 'x'='x",
      } as any;

      // save simula guardado exitoso
      repo.save.mockResolvedValue({ id: 1, email: body.email, password: 'hashed' } as any);

      const res = await service.register(body);
      expect(res).toEqual({ status: 'created' });
      // Confirma que usamos métodos seguros del repo y NO query cruda
      expect(repo.save).toHaveBeenCalled();
      expect(repo.query).not.toHaveBeenCalled();
    });

      });

  describe('XSS (manejo seguro de strings con etiquetas)', () => {
    it('findByEmail no refleja el input en el mensaje de error (sin eco de <script>)', async () => {
      const xss = '<script>alert(1)</script>@test.com';
      repo.findOneBy.mockResolvedValue(undefined as any);

      //Usamos try-catch para poder inspeccionar el error y validar que no contiene una cadena (“<script>”)
      try {
        await service.findByEmail(xss);
        fail('debería lanzar UnauthorizedException');
      } catch (e: any) {
        expect(e).toBeInstanceOf(UnauthorizedException);
        // Vemos que el mensaje de error evita XSS reflejado
        expect(String(e.message)).not.toContain('<script>');
      }
    });

    // Verifica que register hashea la contraseña y trata el email con etiquetas como texto plano.
    // También comprobamos que no se usa SQL crudo (repo.query nunca es llamado).
    it('register almacena strings con etiquetas como datos (no ejecuta nada) y hashea contraseña', async () => {
      const body = { email: '<b>user</b>@mail.com', password: 's3cret' } as any;
      // Observamos que la contraseña que se persiste no sea la original (hash)
      repo.save.mockImplementation(async (u: any) => {
        // interceptamos el argumento de repo.save y comprobamos que la password cambió.
        expect(u.password).not.toBe(body.password);
        // Devolvemos el usuario “guardado”
        return { id: 11, ...u };
      });

      const res = await service.register(body);
      expect(res).toEqual({ status: 'created' });
      expect(repo.query).not.toHaveBeenCalled();
    });

    it('register con fallo del repositorio devuelve error genérico (no refleja mensajes del DB)', async () => {
      const body = { email: 'x@x.com', password: 'secret' } as any;
      // Simulamos un error del driver con contenido HTML/script para verificar que la respuesta sea genérica
      repo.save.mockRejectedValue(new Error('unique violation <script>alert(1)</script>'));

      await expect(service.register(body)).rejects.toEqual(new HttpException('User creation failed', 500));
      // No exponemos el detalle del error ni reflejamos HTML del input/driver en la respuesta
    });
  });
});
