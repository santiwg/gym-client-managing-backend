import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { Repository, In } from 'typeorm';
import { CreatePermissionDto } from './permissionsDto';

@Injectable()
export class PermissionsService {

    constructor(@InjectRepository(Permission) private repository: Repository<Permission>,
                ) {}
    async findPermissionsByNames(permissionNames: string[]): Promise<Permission[]> {
        return await this.repository.find({ where: { name: In(permissionNames), },
        });
    }

    async createPermission(permission: CreatePermissionDto): Promise<Permission> {
        return await this.repository.save(permission)
    }

}