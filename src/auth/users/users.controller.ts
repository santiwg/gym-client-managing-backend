import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginDTO } from '../interfaces/login.dto';
import { RegisterDTO } from '../interfaces/register.dto';
import { Request } from 'express';
import { AuthGuard } from '../middlewares/auth.middleware';
import { RequestWithUser } from '../interfaces/request-user';
import { AssignRoleDto } from './user.Dto';
import { Permissions } from '../middlewares/decorators/permissions.decorator';


@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: RequestWithUser) {
    return {
      email: req.user?.email ?? null,
    };
  }

  @Post('login')
  login(@Body() body: LoginDTO) {
    return this.service.login(body);
  }

  @Post('register')
  register(@Body() body: RegisterDTO) {
    return this.service.register(body);
  }

  @UseGuards(AuthGuard)
  @Get('can-do/:permission')
  canDo(
    @Req() request: RequestWithUser,
    @Param('permission') permission: string,
  ) {
    if (!request.user) {
      throw new Error('User not found in request');
    }
    return this.service.canDo(request.user, permission);
  }

  @Get('refresh-token')
  @Permissions([])
  refreshToken(@Req() request: Request) {
    return this.service.refreshToken(
      request.headers['refresh-token'] as string,
    );
  }

  @UseGuards(AuthGuard)
  @Permissions(['assign-role'])
  @Post('/:id/assignRole')
  async assignRole(@Param('id') id : number, @Body() assignRoleDto : AssignRoleDto){
    return this.service.assignRole(id, assignRoleDto)
  }
}
