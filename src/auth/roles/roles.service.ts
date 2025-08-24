import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { Repository } from 'typeorm';
import { AssignPermissionsDto, CreateRoleDto } from './rolesDto';

@Injectable()
export class RolesService {

    constructor(@InjectRepository(Role) private roleRepository: Repository<Role>,
        private readonly permissionsService: PermissionsService
    ) { }

    hasPermission(role: Role, permission: string) {
        return role.permissions.some(p => p.name === permission)
    }

    async assignNewPermissions(roleName: string, permissionsNames: AssignPermissionsDto): Promise<Role> { // Asigna nuevos permisos.
        const role = await this.findRoleByName(roleName)
        const permissions = await this.permissionsService.findPermissionsByNames(permissionsNames.permissions)
        role.permissions = role.permissions.concat(permissions)
        return await this.roleRepository.save(role)
    }

    async assignPermissions(roleName: string, permissionsNames: AssignPermissionsDto): Promise<Role> { // Modifica los permisos que tiene.
        const role = await this.findRoleByName(roleName)
        const permissions = await this.permissionsService.findPermissionsByNames(permissionsNames.permissions)
        role.permissions = permissions
        return await this.roleRepository.save(role)
    }
    async create(role: CreateRoleDto): Promise<Role> {
        return await this.roleRepository.save(role);
    }

    async findRoleByName(name: string): Promise<Role> {
        const role = await this.roleRepository.findOne({ where: { name } });
        if (!role) {
            throw new Error('Role not found');
        }
        return role;
    }

}
