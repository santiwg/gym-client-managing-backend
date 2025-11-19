/**
 * Pruebas unitarias de validación de permisos
 *
 * Objetivo:
 * - Verificar la lógica de autorización en UsersService.canDo (usa RolesService.hasPermission).
 * - Verificar RolesService.hasPermission y la asignación de permisos (assignPermissions / assignNewPermissions).
 * - Verificar PermissionsService para búsquedas por nombres y creación.
 *
 * Enfoque de UNIT tests (con mocks):
 * - No usamos DB real. Mockeamos los repositorios de TypeORM y los servicios colaboradores.
 * - Probamos casos de éxito y error, explicando el porqué de cada expectativa.
 */

import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { RolesService } from './roles/roles.service';
import { PermissionsService } from './permissions/permissions.service';
import { JwtService } from './jwt/jwt.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

// Helpers para crear mocks de repositorios TypeORM
function createRepoMock<T extends object>() {
	return {
		findOne: jest.fn(),
		find: jest.fn(),
		save: jest.fn(),
	} as unknown as jest.Mocked<Repository<T>>;
}

describe('Permission validation (Users, Roles, Permissions)', () => {
	describe('UsersService.canDo', () => {
		/**
		 * canDo(user, permission) delega en RolesService.hasPermission(role, permission).
		 * - Si el rol tiene el permiso → true.
		 * - Si no lo tiene → lanza UnauthorizedException.
		 */
		it('retorna true cuando el rol tiene el permiso', () => {
			const rolesServiceMock = {
				hasPermission: jest.fn().mockReturnValue(true),
			} as unknown as jest.Mocked<RolesService>;
			const jwtMock = {} as unknown as JwtService;
			const userRepoMock = {} as unknown as Repository<User>;
			const service = new UsersService(jwtMock, userRepoMock, rolesServiceMock);

			const user = { role: { permissions: [{ name: 'read' }] } } as unknown as User;
			const result = service.canDo(user, 'read');
			expect(result).toBe(true);
			expect(rolesServiceMock.hasPermission).toHaveBeenCalledWith(user.role, 'read');
		});

		it('lanza UnauthorizedException cuando el rol NO tiene el permiso', () => {
			const rolesServiceMock = {
				hasPermission: jest.fn().mockReturnValue(false),
			} as unknown as jest.Mocked<RolesService>;
			const jwtMock = {} as unknown as JwtService;
			const userRepoMock = {} as unknown as Repository<User>;
			const service = new UsersService(jwtMock, userRepoMock, rolesServiceMock);

			const user = { role: { permissions: [{ name: 'write' }] } } as unknown as User;
			expect(() => service.canDo(user, 'admin:delete')).toThrow(UnauthorizedException);
			expect(rolesServiceMock.hasPermission).toHaveBeenCalledWith(user.role, 'admin:delete');
		});
	});

	describe('RolesService.hasPermission', () => {
		/**
		 * hasPermission(role, permission) revisa si existe en role.permissions un nombre igual.
		 */
		it('devuelve true si el permiso está presente', () => {
			const role = { permissions: [{ name: 'users:create' }, { name: 'users:read' }] } as Role;
			const rolesService = new RolesService(createRepoMock<Role>(), {} as any);
			expect(rolesService.hasPermission(role, 'users:read')).toBe(true);
		});

		it('devuelve false si el permiso NO está presente', () => {
			const role = { permissions: [{ name: 'users:create' }] } as Role;
			const rolesService = new RolesService(createRepoMock<Role>(), {} as any);
			expect(rolesService.hasPermission(role, 'users:delete')).toBe(false);
		});
	});

	describe('RolesService.assignPermissions / assignNewPermissions', () => {
		/**
		 * - assignPermissions: reemplaza la lista de permisos del rol por los que devuelve PermissionsService.
		 * - assignNewPermissions: concatena los permisos nuevos con los ya existentes.
		 * Verificamos que:
		 * - Se invoca a permissionsService.findPermissionsByNames con los nombres esperados.
		 * - Se guarda el rol con la lista esperada.
		 */
		it('assignPermissions reemplaza los permisos existentes', async () => {
			const roleRepo = createRepoMock<Role>();
			const permsSvc = {
				findPermissionsByNames: jest.fn().mockResolvedValue([
					{ id: 2, name: 'a' },
					{ id: 3, name: 'b' },
				] as Permission[]),
			} as unknown as jest.Mocked<PermissionsService>;
			const rolesService = new RolesService(roleRepo, permsSvc);

			// findRoleByName es llamado internamente por assignPermissions
			roleRepo.findOne.mockResolvedValue({ id: 1, name: 'role', permissions: [{ id: 1, name: 'legacy' }] } as Role);
			roleRepo.save.mockImplementation(async (r: Role) => r);

			const updated = await rolesService.assignPermissions('role', { permissions: ['a', 'b'] });

			expect(permsSvc.findPermissionsByNames).toHaveBeenCalledWith(['a', 'b']);
			expect(updated.permissions.map(p => p.name)).toEqual(['a', 'b']);
			expect(roleRepo.save).toHaveBeenCalled();
		});

		it('assignNewPermissions concatena permisos nuevos con los existentes', async () => {
			const roleRepo = createRepoMock<Role>();
			const permsSvc = {
				findPermissionsByNames: jest.fn().mockResolvedValue([
					{ id: 3, name: 'b' },
				] as Permission[]),
			} as unknown as jest.Mocked<PermissionsService>;
			const rolesService = new RolesService(roleRepo, permsSvc);

			roleRepo.findOne.mockResolvedValue({ id: 1, name: 'role', permissions: [{ id: 2, name: 'a' }] } as Role);
			roleRepo.save.mockImplementation(async (r: Role) => r);

			const updated = await rolesService.assignNewPermissions('role', { permissions: ['b'] });

			expect(updated.permissions.map(p => p.name).sort()).toEqual(['a', 'b']);
			expect(permsSvc.findPermissionsByNames).toHaveBeenCalledWith(['b']);
			expect(roleRepo.save).toHaveBeenCalled();
		});
	});

	describe('PermissionsService', () => {
		/**
		 * findPermissionsByNames debe consultar el repositorio con una condición por nombre (In([...]) internamente).
		 * No verificamos el objeto exacto de TypeORM (FindOperator), pero sí que se invoca con un where.name definido
		 * y que retorna el valor del repositorio.
		 */
		it('findPermissionsByNames llama al repo con where.name y retorna los permisos', async () => {
			const repo = createRepoMock<Permission>();
			const permissions = [{ id: 1, name: 'x' }, { id: 2, name: 'y' }] as Permission[];
			(repo.find as jest.Mock).mockResolvedValue(permissions);

			const svc = new PermissionsService(repo);
			const res = await svc.findPermissionsByNames(['x', 'y']);
			expect(repo.find).toHaveBeenCalledTimes(1);
			const arg = (repo.find as jest.Mock).mock.calls[0][0];
			expect(arg.where).toBeDefined();
			expect(res).toEqual(permissions);
		});

		it('createPermission usa save del repositorio', async () => {
			const repo = createRepoMock<Permission>();
			(repo.save as jest.Mock).mockImplementation(async (p: Permission) => ({ ...p, id: 10 }));

			const svc = new PermissionsService(repo);
			const saved = await svc.createPermission({ name: 'z' });
			expect(saved).toMatchObject({ id: 10, name: 'z' });
			expect(repo.save).toHaveBeenCalledWith({ name: 'z' });
		});
	});
});

