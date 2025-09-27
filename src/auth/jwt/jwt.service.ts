import { Injectable, UnauthorizedException } from '@nestjs/common';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import * as dayjs from 'dayjs';
import { Payload } from '../interfaces/payload';
@Injectable()
export class JwtService {
  // config.ts
  config = {
    auth: {
      secret: 'authSecret',
      expiresIn: '15m' as const,
    },
    refresh: {
      secret: 'refreshSecret',
      expiresIn: '1d' as const,
    },
  };
  generateToken(
    payload: { email: string },
    type: 'refresh' | 'auth' = 'auth',
  ): string {
    const options: SignOptions = {
      expiresIn: this.config[type].expiresIn,
    };
    return sign(payload, this.config[type].secret, options);
  }

  refreshToken(refreshToken: string):{accessToken:string,refreshToken:string} {
    try {
      const payload = this.getPayload(refreshToken,'refresh')
      // Obtiene el tiempo restante en minutos hasta la expiración
      const timeToExpire = dayjs.unix(payload.exp).diff(dayjs(), 'minute');
      return {
        accessToken: this.generateToken({ email: payload.email }),
        refreshToken:
          timeToExpire < 20
            ? this.generateToken({ email: payload.email }, 'refresh')
            : refreshToken
      };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  getPayload(token: string, type: 'refresh' | 'auth' = 'auth'): Payload {
    return verify(token, this.config[type].secret) as Payload;
  }
}
