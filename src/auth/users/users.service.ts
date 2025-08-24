import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO } from '../interfaces/login.dto';
import { RegisterDTO } from '../interfaces/register.dto';
import { User } from '../entities/user.entity';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from '../jwt/jwt.service';
import * as dayjs from 'dayjs';
import { RolesService } from '../roles/roles.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignRoleDto } from './user.Dto';
import { NotFoundError, retry } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(private jwtService: JwtService,
  @InjectRepository(User) private userRepository: Repository<User>,
    private readonly rolesService: RolesService
  ) { }
  async refreshToken(refreshToken: string) {
    return this.jwtService.refreshToken(refreshToken);
  }
  canDo(user: User, permission: string): boolean {
    if (!this.rolesService.hasPermission(user.role, permission)) {
      throw new UnauthorizedException();
    }
    return true;
  }

  async register(body: RegisterDTO) {
    try {
  const user = new User();
      Object.assign(user, body);
      user.password = hashSync(user.password, 10);
      await this.userRepository.save(user);
      //cuando use roles tengo q descomentar esto
      //await this.assignRole(user.id, { roleName: 'user' }) //Por defecto se le pone el rol de usuario
      return { status: 'created' };
    } catch (error) {
      throw new HttpException('User creation failed', 500);
    }
  }

  async login(body: LoginDTO) {
    const user = await this.findByEmail(body.email);
    if (user == null) {
      throw new UnauthorizedException();
    }
    const compareResult = compareSync(body.password, user.password);
    if (!compareResult) {
      throw new UnauthorizedException();
    }
    return {
      accessToken: this.jwtService.generateToken({ email: user.email }, 'auth'),
      refreshToken: this.jwtService.generateToken(
        { email: user.email },
        'refresh',
      )
    };
  }
  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async assignRole(id: number, assignRoleDto: AssignRoleDto) {
    const user = await this.findById(id);
    const role = await this.rolesService.findRoleByName(assignRoleDto.roleName);
    user.role = role;
    return await this.userRepository.save(user)
  }
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}
