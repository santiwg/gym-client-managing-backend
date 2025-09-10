import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { NotFoundException, HttpException } from '@nestjs/common';
import { FeeCollectionService } from '../fee-collection/fee-collection.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { AttendanceService } from '../attendance/attendance.service';

// Mock del ClientService solo para los métodos usados por el controller
const clientServiceMock = {
  findAllPaginated: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('ClientController', () => {
  let controller: ClientController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
    { provide: ClientService, useValue: clientServiceMock },
    { provide: AttendanceService, useValue: {} },
    { provide: SubscriptionService, useValue: {} },
    { provide: FeeCollectionService, useValue: {} },
  ],
}).compile();

    controller = module.get<ClientController>(ClientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllPaginated', () => {
    it('returns paginated clients (success)', async () => {
      const pagination: any = { page: 1, limit: 10 };
      const response = { data: [{ id: 1 }], total: 1, page: 1, limit: 10, lastPage: 1 };
      clientServiceMock.findAllPaginated.mockResolvedValue(response);
      const res = await controller.findAllPaginated(pagination);
      expect(clientServiceMock.findAllPaginated).toHaveBeenCalledWith(pagination);
      expect(res).toBe(response);
    });
    it('propagates error from service', async () => {
      clientServiceMock.findAllPaginated.mockRejectedValue(new Error('db error'));
      await expect(controller.findAllPaginated({ page: 1, limit: 10 } as any)).rejects.toThrow('db error');
    });
  });

  describe('create', () => {
    it('creates a client (success)', async () => {
      const dto: any = { name: 'John' };
      const created = { id: 5, name: 'John' };
      clientServiceMock.create.mockResolvedValue(created);
      const res = await controller.create(dto);
      expect(clientServiceMock.create).toHaveBeenCalledWith(dto);
      expect(res).toBe(created);
    });
    it('propagates service error', async () => {
      const dto: any = { name: 'Err' };
      clientServiceMock.create.mockRejectedValue(new HttpException('fail', 500));
      await expect(controller.create(dto)).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('updates a client (success)', async () => {
      const dto: any = { name: 'New' };
      const updated = { id: 2, name: 'New' };
      clientServiceMock.update.mockResolvedValue(updated);
      const res = await controller.update(2 as any, dto);
      expect(clientServiceMock.update).toHaveBeenCalledWith(2, dto);
      expect(res).toBe(updated);
    });
    it('throws NotFound when service throws NotFoundException', async () => {
      clientServiceMock.update.mockRejectedValue(new NotFoundException());
      await expect(controller.update(99 as any, { name: 'X' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes a client (success)', async () => {
      const message = { message: 'Client with ID 3 deleted successfully' };
      clientServiceMock.delete.mockResolvedValue(message);
      const res = await controller.delete(3 as any);
      expect(clientServiceMock.delete).toHaveBeenCalledWith(3);
      expect(res).toBe(message);
    });
    it('propagates NotFoundException', async () => {
      clientServiceMock.delete.mockRejectedValue(new NotFoundException());
      await expect(controller.delete(123 as any)).rejects.toThrow(NotFoundException);
    });
  });
});
