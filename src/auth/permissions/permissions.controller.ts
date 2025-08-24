import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuthGuard } from '../middlewares/auth.middleware';
import { Permissions } from '../middlewares/decorators/permissions.decorator'; 
import { CreatePermissionDto } from './permissionsDto';
@Controller('permissions')
export class PermissionsController {
constructor(private permissionService: PermissionsService) {}

  @UseGuards(AuthGuard)
  @Permissions(['create-permission'])
  @Post()
  async createPermission(@Body() name: CreatePermissionDto) {
    return await this.permissionService.createPermission(name)
  }


}
