import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendance } from './attendance.entity';
import { SaveOptions, RemoveOptions, Not } from 'typeorm';
import { SubscriptionService } from '../subscription/subscription.service';
import { ClientDto } from '../client/dtos/client.dto';
import { AttendanceDto } from './dtos/attendance.dto';
import { Subscription } from '../subscription/subscription.entity';
import { NotFoundException } from '@nestjs/common';

/*
getClientCurrentSubscription(clientDocumentNumber,undefined);
*/

describe('AttendanceService', () => {
  let service: AttendanceService;
  const attendanceRepositoryMock = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn()
    // otros métodos si los usás
  };
  const subscriptionServiceMock = {
    getClientCurrentSubscription: jest.fn(),
    getAttendanceLimit: jest.fn(),
    isActive: jest.fn(),
  };

  // Usar fecha fija para evitar errores por milisegundos
  const fixedDate = new Date('2025-08-30T03:22:25.156Z');
  const monday = new Date('2025-08-25T00:00:00.000Z');
  const wednesday = new Date('2025-08-27T00:00:00.000Z');
  const friday = new Date('2025-08-29T00:00:00.000Z');
  const lastWeek = new Date('2025-08-18T00:00:00.000Z');
  const twoWeeksAgo = new Date('2025-08-11T00:00:00.000Z');

  const newAttendanceDtoMock: AttendanceDto = { clientDocumentNumber: '12345678' };
  const subscriptionMock: Subscription = { id: 1 } as Subscription;

  const attendancesMock: Attendance[] = [
    { id: 1, dateTime: monday } as Attendance,
    { id: 2, dateTime: wednesday } as Attendance,
    { id: 3, dateTime: friday } as Attendance,
    { id: 4, dateTime: lastWeek } as Attendance,
    { id: 5, dateTime: twoWeeksAgo } as Attendance,
  ];
  beforeEach(async () => {
    jest.clearAllMocks();
    Object.values(attendanceRepositoryMock).forEach(fn => fn.mockReset && fn.mockReset());
    Object.values(subscriptionServiceMock).forEach(fn => fn.mockReset && fn.mockReset());
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: attendanceRepositoryMock,
        },
        { provide: SubscriptionService, useValue: subscriptionServiceMock },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });
  describe('create', () => {
    it('should create a new attendance record', async () => {
      const { clientDocumentNumber, ...data } = newAttendanceDtoMock;
      subscriptionServiceMock.getClientCurrentSubscription.mockResolvedValue(subscriptionMock);
      subscriptionServiceMock.isActive.mockReturnValue(true);
      service.validateCurrentWeekAttendanceLimitIsExceeded = jest.fn().mockResolvedValue(false);
      attendanceRepositoryMock.save.mockResolvedValue({ subscription: subscriptionMock, date: fixedDate, id: 1 });
      attendanceRepositoryMock.create.mockReturnValue({ subscription: subscriptionMock, date: fixedDate });
      const result = await service.create(newAttendanceDtoMock);
      expect(result).toEqual({ success: true });
      expect(attendanceRepositoryMock.save).toHaveBeenCalledWith({ subscription: subscriptionMock, date: fixedDate });
      expect(attendanceRepositoryMock.create).toHaveBeenCalledWith({ subscription: subscriptionMock, ...data });
      expect(subscriptionServiceMock.getClientCurrentSubscription).toHaveBeenCalledWith(newAttendanceDtoMock.clientDocumentNumber, undefined);
      expect(subscriptionServiceMock.isActive).toHaveBeenCalledWith(subscriptionMock);
      expect(service.validateCurrentWeekAttendanceLimitIsExceeded).toHaveBeenCalledWith(subscriptionMock);
    });
    it('should not create a new attendance record due to exceeded limit', async () => {
      const { clientDocumentNumber, ...data } = newAttendanceDtoMock;
      subscriptionServiceMock.getClientCurrentSubscription.mockResolvedValue(subscriptionMock);
      subscriptionServiceMock.isActive.mockReturnValue(true);
      service.validateCurrentWeekAttendanceLimitIsExceeded = jest.fn().mockResolvedValue(true);
      const result = await service.create(newAttendanceDtoMock);
      expect(result).toEqual({ success: false, message: 'Attendance limit exceeded' });
      expect(subscriptionServiceMock.getClientCurrentSubscription).toHaveBeenCalledWith(newAttendanceDtoMock.clientDocumentNumber, undefined);
      expect(subscriptionServiceMock.isActive).toHaveBeenCalledWith(subscriptionMock);
      expect(service.validateCurrentWeekAttendanceLimitIsExceeded).toHaveBeenCalledWith(subscriptionMock);
      expect(attendanceRepositoryMock.save).not.toHaveBeenCalled();
      expect(attendanceRepositoryMock.create).not.toHaveBeenCalled();
    });
    it('should not create a new attendance record due to inactive subscription', async () => {
      const { clientDocumentNumber, ...data } = newAttendanceDtoMock;
      subscriptionServiceMock.getClientCurrentSubscription.mockResolvedValue(subscriptionMock);
      subscriptionServiceMock.isActive.mockReturnValue(false);
      service.validateCurrentWeekAttendanceLimitIsExceeded = jest.fn();
      const result = await service.create(newAttendanceDtoMock);
      expect(result).toEqual({ success: false, message: 'Inactive subscription' });
      expect(attendanceRepositoryMock.save).not.toHaveBeenCalled();
      expect(attendanceRepositoryMock.create).not.toHaveBeenCalled();
      expect(subscriptionServiceMock.getClientCurrentSubscription).toHaveBeenCalledWith(newAttendanceDtoMock.clientDocumentNumber, undefined);
      expect(subscriptionServiceMock.isActive).toHaveBeenCalledWith(subscriptionMock);
      expect(service.validateCurrentWeekAttendanceLimitIsExceeded).not.toHaveBeenCalled();
    });
    it('should not create a new attendance record due to not found subscription', async () => {
      const { clientDocumentNumber, ...data } = newAttendanceDtoMock;
      subscriptionServiceMock.getClientCurrentSubscription.mockResolvedValue(null);
      service.validateCurrentWeekAttendanceLimitIsExceeded = jest.fn();
      const result = await service.create(newAttendanceDtoMock);
      expect(result).toEqual({ success: false, message: 'No active subscription found' });
      expect(attendanceRepositoryMock.save).not.toHaveBeenCalled();
      expect(attendanceRepositoryMock.create).not.toHaveBeenCalled();
      expect(subscriptionServiceMock.getClientCurrentSubscription).toHaveBeenCalledWith(newAttendanceDtoMock.clientDocumentNumber, undefined);
      expect(subscriptionServiceMock.isActive).not.toHaveBeenCalled();
      expect(service.validateCurrentWeekAttendanceLimitIsExceeded).not.toHaveBeenCalled();
    });
    it('should throw if subscriptionService throws', async () => {
      const { clientDocumentNumber, ...data } = newAttendanceDtoMock;
      subscriptionServiceMock.getClientCurrentSubscription.mockImplementation(() => { throw new NotFoundException(); });
      service.validateCurrentWeekAttendanceLimitIsExceeded = jest.fn();
      subscriptionServiceMock.isActive.mockReturnValue(true);
      attendanceRepositoryMock.save.mockResolvedValue({ subscription: subscriptionMock, date: fixedDate, id: 1 });
      attendanceRepositoryMock.create.mockReturnValue({ subscription: subscriptionMock, date: fixedDate });
      await expect(service.create(newAttendanceDtoMock)).rejects.toThrow(NotFoundException);
      expect(attendanceRepositoryMock.save).not.toHaveBeenCalled();
      expect(attendanceRepositoryMock.create).not.toHaveBeenCalled();
      expect(subscriptionServiceMock.getClientCurrentSubscription).toHaveBeenCalledWith(newAttendanceDtoMock.clientDocumentNumber, undefined);
      expect(subscriptionServiceMock.isActive).not.toHaveBeenCalled();
      expect(service.validateCurrentWeekAttendanceLimitIsExceeded).not.toHaveBeenCalled();
    });
    it('should throw if database throws', async () => {
      const { clientDocumentNumber, ...data } = newAttendanceDtoMock;
      subscriptionServiceMock.getClientCurrentSubscription.mockResolvedValue(subscriptionMock);
      subscriptionServiceMock.isActive.mockReturnValue(true);
      service.validateCurrentWeekAttendanceLimitIsExceeded = jest.fn().mockResolvedValue(false);
      attendanceRepositoryMock.save.mockImplementation(() => { throw new Error('DB error'); });
      attendanceRepositoryMock.create.mockReturnValue({ subscription: subscriptionMock, date: fixedDate });
      await expect(service.create(newAttendanceDtoMock)).rejects.toThrow(Error);
      expect(attendanceRepositoryMock.save).toHaveBeenCalledWith({ subscription: subscriptionMock, date: fixedDate });
      expect(attendanceRepositoryMock.create).toHaveBeenCalledWith({ subscription: subscriptionMock, ...data });
      expect(subscriptionServiceMock.getClientCurrentSubscription).toHaveBeenCalledWith(newAttendanceDtoMock.clientDocumentNumber, undefined);
      expect(subscriptionServiceMock.isActive).toHaveBeenCalledWith(subscriptionMock);
      expect(service.validateCurrentWeekAttendanceLimitIsExceeded).toHaveBeenCalledWith(subscriptionMock);
    });
  });
  describe('validateCurrentWeekAttendanceLimitIsExceeded', () => {
    it('should return true if attendance limit is exceeded', async () => {
      subscriptionServiceMock.getAttendanceLimit.mockReturnValue(3);
      attendanceRepositoryMock.find.mockResolvedValue(attendancesMock);
      const result = await service.validateCurrentWeekAttendanceLimitIsExceeded(subscriptionMock);
      expect(result).toBe(true);
      expect(subscriptionServiceMock.getAttendanceLimit).toHaveBeenCalledWith(subscriptionMock.id);
      expect(attendanceRepositoryMock.find).toHaveBeenCalledWith({
        where: {
          subscription: subscriptionMock,
          dateTime: expect.anything()
        }
      });
    });
    it('should return false if attendance limit is not exceeded', async () => {
      subscriptionServiceMock.getAttendanceLimit.mockReturnValue(10);
      attendanceRepositoryMock.find.mockResolvedValue(attendancesMock);
      const result = await service.validateCurrentWeekAttendanceLimitIsExceeded(subscriptionMock);
      expect(result).toBe(false);
      expect(subscriptionServiceMock.getAttendanceLimit).toHaveBeenCalledWith(subscriptionMock.id);
      expect(attendanceRepositoryMock.find).toHaveBeenCalledWith({
        where: {
          subscription: subscriptionMock,
          dateTime: expect.anything()
        }
      });
    });
    it('should be defined', () => {
      expect(service).toBeDefined();
    });


  });
});
