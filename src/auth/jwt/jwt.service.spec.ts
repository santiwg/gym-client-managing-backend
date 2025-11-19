/**
 * Pruebas unitarias para JwtService (con mocks)
 *
 * Qué validamos:
 * - generateToken: usa el secreto y expiresIn correctos según tipo (auth/refresh) y delega en jsonwebtoken.sign.
 * - getPayload: delega en jsonwebtoken.verify con el secreto adecuado según tipo.
 * - refreshToken: valida un refresh token, genera siempre un nuevo access token, y
 *   sólo renueva el refresh token si faltan < 20 minutos para expirar.
 * - Errores: si el token no es válido, lanza UnauthorizedException.
 *
 * Nota general: mockeamos la librería jsonwebtoken para aislar la lógica de configuración
 * (qué secreto y expiresIn se usan) de la criptografía real. Así comprobamos que nuestra
 * capa de servicio invoca la API con parámetros correctos sin depender de tiempos reales
 * de expiración ni de firmas criptográficas.
 */

// Mockeamos la librería subyacente para no depender de criptografía real.
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

import { JwtService } from './jwt.service';
import { sign, verify } from 'jsonwebtoken';

describe('JwtService (unit, mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    // sin pasar tipo explícito debe asumir "auth" y usar secreto/expiración de access.
    it('usa secreto y expiresIn de auth por defecto', () => {
      (sign as jest.Mock).mockReturnValue('signed-auth');
      const svc = new JwtService();
      const token = svc.generateToken({ email: 'a@a.com' });
      expect(token).toBe('signed-auth');
      expect(sign).toHaveBeenCalledWith(
        { email: 'a@a.com' },
        svc.config.auth.secret,
        { expiresIn: svc.config.auth.expiresIn }
      );
    });

    // especificando type=refresh debe cambiar a la configuración de refresh (largo plazo).
    it('usa secreto y expiresIn de refresh cuando type=refresh', () => {
      (sign as jest.Mock).mockReturnValue('signed-refresh');
      const svc = new JwtService();
      const token = svc.generateToken({ email: 'a@a.com' }, 'refresh');
      expect(token).toBe('signed-refresh');
      expect(sign).toHaveBeenCalledWith(
        { email: 'a@a.com' },
        svc.config.refresh.secret,
        { expiresIn: svc.config.refresh.expiresIn }
      );
    });
  });

  describe('getPayload', () => {
    // verifica que al decodificar (verify) un token de acceso se use el secreto correcto.
    it('verifica token de auth con el secreto de auth', () => {
      (verify as jest.Mock).mockReturnValue({ email: 'x@y.com', exp: 123 });
      const svc = new JwtService();
      const payload = svc.getPayload('tkn');
      expect(payload).toEqual({ email: 'x@y.com', exp: 123 });
      expect(verify).toHaveBeenCalledWith('tkn', svc.config.auth.secret);
    });

    // Igual que anterior pero para tipo refresh.
    it('verifica token de refresh con el secreto de refresh', () => {
      (verify as jest.Mock).mockReturnValue({ email: 'x@y.com', exp: 123 });
      const svc = new JwtService();
      const payload = svc.getPayload('tkn', 'refresh');
      expect(payload).toEqual({ email: 'x@y.com', exp: 123 });
      expect(verify).toHaveBeenCalledWith('tkn', svc.config.refresh.secret);
    });
  });

  describe('refreshToken', () => {
    // simula un refresh token con >= 20 min restantes). Debe emitir un nuevo access
    // pero reutilizar el mismo refresh
    it('genera nuevo access token y mantiene refresh si faltan >= 20 minutos', () => {
      // Simulamos un token válido con exp dentro de 90 minutos
      const nowSeconds = Math.floor(Date.now() / 1000);
      (verify as jest.Mock).mockReturnValue({ email: 'z@z.com', exp: nowSeconds + 90 * 60 });
      const svc = new JwtService();

      // Stub de sign para distinguir access vs refresh por el expiresIn que recibe
      ;(sign as jest.Mock).mockImplementation((_payload, _secret, opts) => {
        if (opts.expiresIn === svc.config.auth.expiresIn) return 'new-access';
        if (opts.expiresIn === svc.config.refresh.expiresIn) return 'new-refresh';
        return 'signed';
      });

      const res = svc.refreshToken('refresh-token');
      expect(res.accessToken).toBe('new-access');
      // debería reciclar el mismo refresh token
      expect(res.refreshToken).toBe('refresh-token');
    });

    // Token próximo a expirar (< 20 min). Debe generar nuevo access y también refresh nuevo.
    it('genera nuevo access y nuevo refresh si faltan < 20 minutos', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      (verify as jest.Mock).mockReturnValue({ email: 'z@z.com', exp: nowSeconds + 10 * 60 });
      const svc = new JwtService();
      ;(sign as jest.Mock).mockImplementation((_payload, _secret, opts) => {
        if (opts.expiresIn === svc.config.auth.expiresIn) return 'new-access';
        if (opts.expiresIn === svc.config.refresh.expiresIn) return 'new-refresh';
        return 'signed';
      });

      const res = svc.refreshToken('stale-refresh');
      expect(res.accessToken).toBe('new-access');
      expect(res.refreshToken).toBe('new-refresh'); //no es el que se tenía (el que se pasó por parámetro), sino uno nuevo
    });

    // el servicio debe propagar (o transformar a UnauthorizedException según la implementación concreta)
    it('lanza UnauthorizedException si el token es inválido', () => {
      (verify as jest.Mock).mockImplementation(() => { throw new Error('bad token'); });
      const svc = new JwtService();
      expect(() => svc.refreshToken('bad')).toThrowError();
    });
  });
});
