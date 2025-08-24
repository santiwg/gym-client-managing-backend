import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../interfaces/request-user';
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from '../users/users.service';
import { Permissions } from './decorators/permissions.decorator';
import { ForbiddenException } from '@nestjs/common';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private reflector:Reflector
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: RequestWithUser = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('El token no existe');
      }
      const token = authHeader.replace('Bearer ', '');
      const payload = this.jwtService.getPayload(token);
      const user = await this.usersService.findByEmail(payload.email);
      request.user = user;
      const permissions = this.reflector.get(Permissions, context.getHandler()) ?? [];
      const hasPermission = permissions.every(permission => this.usersService.canDo(user,permission));
      if (!hasPermission){
        throw new ForbiddenException('Not enough permissions');
      }
      return true;
    } catch (error) {
      throw new UnauthorizedException(error?.message);
    }
  }
}
