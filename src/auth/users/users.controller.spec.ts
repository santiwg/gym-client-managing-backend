// UsersController unit tests
//
// What to know:
// - We mock UsersService to isolate controller behavior and to assert call shapes.
// - We override AuthGuard to avoid real auth wiring during tests.
// - The refreshToken endpoint validates the 'refresh-token' header; missing it throws Unauthorized synchronously.
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../middlewares/auth.middleware';

// Mocked UsersService methods used by the controller
const usersServiceMock = {
	login: jest.fn(),
	register: jest.fn(),
	refreshToken: jest.fn(),
};

// Mocked AuthGuard to always allow access during tests
const authGuardMock = {
	canActivate: jest.fn().mockReturnValue(true), // Siempre permite el acceso
};

describe('UsersController', () => {
	let controller: UsersController;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{ provide: UsersService, useValue: usersServiceMock },
			],
		})
			// Replace the real guard with a trivial mock to focus on controller behavior
			.overrideGuard(AuthGuard)
			.useValue(authGuardMock)
			.compile();

		controller = module.get<UsersController>(UsersController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('login', () => {
	// Happy path: login returns tokens from the service
	it('returns tokens on success', async () => {
			const dto: any = { email: 'a@a.com', password: '123' };
			usersServiceMock.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

			const result = await controller.login(dto);
			expect(usersServiceMock.login).toHaveBeenCalledWith(dto);
			expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
		});

	// Error path: controller propagates UnauthorizedException from the service
	it('propagates UnauthorizedException', async () => {
			const dto: any = { email: 'x@x.com', password: 'bad' };
			usersServiceMock.login.mockRejectedValue(new UnauthorizedException());
			await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
			expect(usersServiceMock.login).toHaveBeenCalledWith(dto);
		});
	});

	describe('register', () => {
	// Happy path: register forwards DTO and returns service result
	it('returns created status on success', async () => {
			const dto: any = { email: 'new@ex.com', password: 'plain' };
			usersServiceMock.register.mockResolvedValue({ status: 'created' });
			const res = await controller.register(dto);
			expect(usersServiceMock.register).toHaveBeenCalledWith(dto);
			expect(res).toEqual({ status: 'created' });
		});

	// Error path: controller propagates HttpException thrown by the service
	it('propagates HttpException when service fails', async () => {
			const dto: any = { email: 'fail@ex.com', password: 'plain' };
			usersServiceMock.register.mockRejectedValue(new HttpException('User creation failed', 500));
			await expect(controller.register(dto)).rejects.toThrow(HttpException);
			expect(usersServiceMock.register).toHaveBeenCalledWith(dto);
		});
	});

	describe('refreshToken', () => {
	// Happy path: header present, controller delegates to service and returns tokens
	it('returns refreshed tokens (success)', async () => {
			usersServiceMock.refreshToken.mockResolvedValue({ accessToken: 'newA', refreshToken: 'newR' });
			const req: any = { headers: { 'refresh-token': 'oldR' } };
			const res = await controller.refreshToken(req);
			expect(usersServiceMock.refreshToken).toHaveBeenCalledWith('oldR');
			expect(res).toEqual({ accessToken: 'newA', refreshToken: 'newR' });
		});

	// Error path: service rejects -> controller propagates error
	it('propagates error from service', async () => {
			usersServiceMock.refreshToken.mockRejectedValue(new Error('token error'));
			const req: any = { headers: { 'refresh-token': 'bad' } };
			await expect(controller.refreshToken(req)).rejects.toThrow('token error');
			expect(usersServiceMock.refreshToken).toHaveBeenCalledWith('bad');
		});

		

	// Synchronous validation: missing header throws Unauthorized immediately (no await)
	it('throws UnauthorizedException when header missing', async () => {
			const req: any = { headers: {} };
			await expect(() => controller.refreshToken(req)).toThrow(UnauthorizedException);
			expect(usersServiceMock.refreshToken).not.toHaveBeenCalled();
		});
	});
});

