// UsersService unit tests
//
// What to know:
// - We mock external dependencies (TypeORM repository, JwtService, RolesService) to isolate service logic.
// - bcrypt is mocked to avoid real hashing and allow predictable assertions (fast + deterministic tests).
// - We use partial argument matching (e.g., objectContaining) when options may grow to avoid brittle tests.
// - For error branches, we assert the specific NestJS exceptions thrown and ensure side effects do not occur.
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { JwtService } from '../jwt/jwt.service';
import { RolesService } from '../roles/roles.service';
import { HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { hashSync, compareSync } from 'bcrypt';

// Mock bcrypt to avoid real hashing cost and allow precise assertions
// - hashSync always returns 'hashed-pass' so we can assert that value is persisted
// - compareSync is configured per-test to simulate match/mismatch
jest.mock('bcrypt', () => ({
	hashSync: jest.fn().mockReturnValue('hashed-pass'),
	compareSync: jest.fn(),
}));

describe('UsersService', () => {
	let service: UsersService;

	// Repository mock
	const userRepositoryMock: Partial<Record<keyof Repository<User>, jest.Mock>> = {
		findOneBy: jest.fn(),
		findOne: jest.fn(),
		save: jest.fn(),
	};

	// Dependency mocks
	const jwtServiceMock = {
		refreshToken: jest.fn(),
		generateToken: jest.fn(),
	};
	const rolesServiceMock = {
		hasPermission: jest.fn(),
		findRoleByName: jest.fn(),
	};

	const baseUser: User = {
		id: 1,
		email: 'john@example.com',
		password: 'hashed-pass', // aligned with mocked hashSync return
		role: undefined as any,
	} as any;

	beforeEach(async () => {
		jest.clearAllMocks();
	(hashSync as jest.Mock).mockClear();
	(compareSync as jest.Mock).mockClear();
		Object.values(userRepositoryMock).forEach(fn => fn && fn.mockReset());
		Object.values(jwtServiceMock).forEach(fn => fn && fn.mockReset());
		Object.values(rolesServiceMock).forEach(fn => fn && fn.mockReset());

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{ provide: getRepositoryToken(User), useValue: userRepositoryMock },
				{ provide: JwtService, useValue: jwtServiceMock },
				{ provide: RolesService, useValue: rolesServiceMock },
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('refreshToken', () => {
		// Happy path: delegates to JwtService.refreshToken
		it('returns refreshed token', async () => {
			jwtServiceMock.refreshToken.mockResolvedValue({ accessToken: 'newAccess', refreshToken: 'newRefresh' });
			const res = await service.refreshToken('old');
			expect(jwtServiceMock.refreshToken).toHaveBeenCalledWith('old');
			expect(res).toEqual({ accessToken: 'newAccess', refreshToken: 'newRefresh' });
		});
		it('propagates errors from jwtService', async () => {
			jwtServiceMock.refreshToken.mockRejectedValue(new Error('jwt error'));
			await expect(service.refreshToken('x')).rejects.toThrow('jwt error');
            expect(jwtServiceMock.refreshToken).toHaveBeenCalledWith('x');
			expect(jwtServiceMock.refreshToken).toHaveBeenCalledTimes(1);
		});
	});

	describe('register', () => {
		// Registration: password is hashed, user is saved, and a simple status is returned
		it('hashes password and saves user (success)', async () => {
			const dto: any = { email: 'new@example.com', password: 'plain' };
			userRepositoryMock.save!.mockImplementation(async (u: any) => ({ ...u, id: 10 }));

			const result = await service.register(dto);
			expect(userRepositoryMock.save).toHaveBeenCalled();

			// Jest tip: mock.calls contains all call args for a mock. We read the first call argument (saved user).
			const savedArg = userRepositoryMock.save!.mock.calls[0][0];
			expect(hashSync).toHaveBeenCalledWith('plain', 10); // it called hashSync with salt rounds 10
			expect(savedArg.password).toBe('hashed-pass'); // mocked hashed password
			expect(savedArg.email).toBe(dto.email); // verifies the email was saved correctly
			expect(result).toEqual({ status: 'created' });
		});
		// Database failure: service wraps in HttpException(500) with an explanatory message
		it('throws HttpException when repository.save fails', async () => {
			const dto: any = { email: 'fail@example.com', password: 'plain' };
			userRepositoryMock.save!.mockRejectedValue(new Error('db fail'));

			let caught: any;
			try {
				await service.register(dto);
			} catch (e) {
				caught = e;
			}
			expect(hashSync).toHaveBeenCalledWith('plain', 10); // se llamó hashSync al intentar crear el usuario
			expect(caught).toBeInstanceOf(HttpException);
			expect(caught.getStatus()).toBe(500);
			expect(caught.message).toContain('User creation failed');
		});
	});

	describe('login', () => {
		// Login: spy on findByEmail to isolate credential flow; chain two token returns (access then refresh)
		it('returns access and refresh tokens for valid credentials', async () => {
			(compareSync as jest.Mock).mockReturnValue(true);
			const user = { ...baseUser } as User;
			// Spy on findByEmail to isolate logic
			const spy = jest.spyOn(service, 'findByEmail').mockResolvedValue(user);
			jwtServiceMock.generateToken
				.mockReturnValueOnce('accessToken')
				.mockReturnValueOnce('refreshToken'); //Sets different return values for the first two calls of the mock.

			const res = await service.login({ email: 'john@example.com', password: 'secret' });
			expect(spy).toHaveBeenCalledWith('john@example.com');
			// toHaveBeenNthCalledWith(n, ...): assert the exact arguments passed on the nth call to this mock (here: the 1st call)
			expect(jwtServiceMock.generateToken).toHaveBeenNthCalledWith(1, { email: user.email }, 'auth');
			expect(jwtServiceMock.generateToken).toHaveBeenNthCalledWith(2, { email: user.email }, 'refresh');
			expect(res).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
		});
		// Password mismatch: compareSync(false) -> UnauthorizedException
		it('throws UnauthorizedException when password mismatch', async () => {
			(compareSync as jest.Mock).mockReturnValue(false);
			const user = { ...baseUser } as User;
			jest.spyOn(service, 'findByEmail').mockResolvedValue(user);
			await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toThrow(UnauthorizedException);
			expect(jwtServiceMock.generateToken).not.toHaveBeenCalled();
		});
		// User not found: service.findByEmail throws Unauthorized and we propagate it
		it('propagates UnauthorizedException when user not found', async () => {
	expect(compareSync).not.toHaveBeenCalled();
			jest.spyOn(service, 'findByEmail').mockRejectedValue(new UnauthorizedException());
			await expect(service.login({ email: 'no@x.com', password: 'whatever' })).rejects.toThrow(UnauthorizedException);
			expect(jwtServiceMock.generateToken).not.toHaveBeenCalled();
		});
	});

	describe('findByEmail', () => {
		it('returns user when found', async () => {
			userRepositoryMock.findOneBy!.mockResolvedValue(baseUser);
			const res = await service.findByEmail(baseUser.email);
			expect(res).toBe(baseUser);
			expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ email: baseUser.email });
		});
		it('throws UnauthorizedException when not found', async () => {
			userRepositoryMock.findOneBy!.mockResolvedValue(null);
			await expect(service.findByEmail('missing@example.com')).rejects.toThrow(UnauthorizedException);
		});
		it('propagates repository errors', async () => {
			userRepositoryMock.findOneBy!.mockRejectedValue(new Error('db error'));
			await expect(service.findByEmail('x')).rejects.toThrow('db error');
		});
	});

	describe('findById', () => {
		it('returns user when found', async () => {
			userRepositoryMock.findOne!.mockResolvedValue(baseUser);
			const res = await service.findById(1);
			expect(res).toBe(baseUser);
			expect(userRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
		});
		it('throws NotFoundException when not found', async () => {
			userRepositoryMock.findOne!.mockResolvedValue(null);
			await expect(service.findById(99)).rejects.toThrow(NotFoundException);
		});
		it('propagates repository errors', async () => {
			userRepositoryMock.findOne!.mockRejectedValue(new Error('db err'));
			await expect(service.findById(2)).rejects.toThrow('db err');
		});
	});
});
