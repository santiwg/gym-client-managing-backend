// SubscriptionService unit tests
//
// What to know:
// - We mock the repository and dependent services (ClientService, MembershipService, StateService, FeeCollectionService).
// - We cover state transitions (Active/Inactive/Suspended), payment validation, and default startDate on create.
// - Internal helpers are stubbed where needed to avoid side effects and keep tests focused.
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './subscription.entity';
import { SubscriptionDto } from './dtos/subscription.dto';
import { ClientService } from '../client/client.service';
import { MembershipService } from 'src/membership/membership/membership.service';
import { StateService } from 'src/shared/state/state.service';
import { FeeCollectionService } from '../fee-collection/fee-collection.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  // Mocks
  const repositoryMock: Partial<Record<keyof Repository<Subscription>, jest.Mock>> = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const clientServiceMock = {
    findById: jest.fn(),
    findByDocumentNumber: jest.fn(),
  };
  const membershipServiceMock = {
    findById: jest.fn(),
  };
  const stateServiceMock = {
    findActiveState: jest.fn(),
    findInactiveState: jest.fn(),
    findSuspendedState: jest.fn(),
    isActive: jest.fn(),
  };
  const feeCollectionServiceMock = {
    validateUpToDatePayment: jest.fn(),
  };

  // Common test data
  const activeState = { id: 1, name: 'Active' } as any;
  const inactiveState = { id: 2, name: 'Inactive' } as any;
  const suspendedState = { id: 3, name: 'Suspended' } as any;
  const membership = { id: 10, monthlyPrice: 100, weeklyAttendanceLimit: 3 } as any;
  const baseSubscription: Subscription = {
    id: 1,
    startDate: new Date('2025-01-01'),
    membership: membership as any,
    state: activeState as any,
    feeCollections: [],
    attendances: [],
    client: { id: 99 } as any,
  } as any;

  beforeEach(async () => {
    // Reset all mocks like in your other test
    jest.clearAllMocks();
    Object.values(repositoryMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(clientServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(membershipServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(stateServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(feeCollectionServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(Subscription), useValue: repositoryMock },
        { provide: ClientService, useValue: clientServiceMock },
        { provide: MembershipService, useValue: membershipServiceMock },
        { provide: StateService, useValue: stateServiceMock },
        { provide: FeeCollectionService, useValue: feeCollectionServiceMock },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClientCurrentSubscription', () => {
    it('returns latest subscription by clientId and validates payment', async () => {
      const older = { ...baseSubscription, id: 2, startDate: new Date('2024-12-01') } as Subscription;
      const newer = { ...baseSubscription, id: 3, startDate: new Date('2025-02-01') } as Subscription;
      clientServiceMock.findById.mockResolvedValue({ subscriptions: [older, newer] });
      // Avoid side effects: stub internal validation
      service.validateUpToDatePayment = jest.fn();

      const result = await service.getClientCurrentSubscription(undefined, 99);
      expect(result).toBe(newer);
      expect(clientServiceMock.findById).toHaveBeenCalledWith(99);
      expect(clientServiceMock.findByDocumentNumber).not.toHaveBeenCalled();
      expect(service.validateUpToDatePayment).toHaveBeenCalledWith(newer);
    });
    it('returns latest subscription by clientDocumentNumber and validates payment', async () => {
      const older = { ...baseSubscription, id: 2, startDate: new Date('2024-12-01') } as Subscription;
      const newer = { ...baseSubscription, id: 3, startDate: new Date('2025-02-01') } as Subscription;
      clientServiceMock.findByDocumentNumber.mockResolvedValue({ subscriptions: [older, newer] });
      // Avoid side effects: stub internal validation
      service.validateUpToDatePayment = jest.fn();

      const result = await service.getClientCurrentSubscription("99", undefined);
      expect(result).toBe(newer);
      expect(clientServiceMock.findById).not.toHaveBeenCalled();
      expect(clientServiceMock.findByDocumentNumber).toHaveBeenCalledWith("99");
      expect(service.validateUpToDatePayment).toHaveBeenCalledWith(newer);
    });
    it('should throw if clientService throws', async () => {
      clientServiceMock.findByDocumentNumber.mockRejectedValue(new NotFoundException('Client not found'));
      // Avoid side effects: stub internal validation
      service.validateUpToDatePayment = jest.fn();

      await expect(service.getClientCurrentSubscription("99", undefined)).rejects.toThrow(NotFoundException);
      expect(clientServiceMock.findById).not.toHaveBeenCalled();
      expect(clientServiceMock.findByDocumentNumber).toHaveBeenCalledWith("99");
      expect(service.validateUpToDatePayment).not.toHaveBeenCalled();
    });
    it('should throw if there is no subscription', async () => {
      clientServiceMock.findByDocumentNumber.mockResolvedValue({ subscriptions: [] });
      // Avoid side effects: stub internal validation
      service.validateUpToDatePayment = jest.fn();

      await expect(service.getClientCurrentSubscription("99", undefined)).rejects.toThrow(NotFoundException);
      expect(clientServiceMock.findById).not.toHaveBeenCalled();
      expect(clientServiceMock.findByDocumentNumber).toHaveBeenCalledWith("99");
      expect(service.validateUpToDatePayment).not.toHaveBeenCalled();
    });
    it('returns null when neither clientId nor documentNumber is provided', async () => {
      const result = await service.getClientCurrentSubscription(undefined, undefined);
      expect(result).toBeNull();
      expect(clientServiceMock.findById).not.toHaveBeenCalled();
      expect(clientServiceMock.findByDocumentNumber).not.toHaveBeenCalled();
    });
  });
  describe('findById', () => {
    it('returns subscription and validates payment', async () => {
      repositoryMock.findOne!.mockResolvedValue(baseSubscription);
      service.validateUpToDatePayment = jest.fn();

      const result = await service.findById(1);
      expect(result).toBe(baseSubscription);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['client', 'membership', 'state'],
      });
      expect(service.validateUpToDatePayment).toHaveBeenCalledWith(baseSubscription);
    });
    it('throws NotFoundException if subscription does not exist', async () => {
      repositoryMock.findOne!.mockResolvedValue(null);
      service.validateUpToDatePayment = jest.fn();
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['client', 'membership', 'state'],
      });
      expect(service.validateUpToDatePayment).not.toHaveBeenCalled();
    });
    it('propagates repository errors', async () => {
      repositoryMock.findOne!.mockRejectedValue(new Error('DB error'));
      await expect(service.findById(5)).rejects.toThrow('DB error');
    });


    describe('getHistoricalUnitAmount', () => {
      it('returns membership.monthlyPrice from subscription', async () => {
        const subscription = { ...baseSubscription, membership } as Subscription;
        service.findById = jest.fn().mockResolvedValue(subscription);

        const price = await service.getHistoricalUnitAmount(subscription.id);
        expect(price).toBe(100);
        expect(service.findById).toHaveBeenCalledWith(subscription.id);
      });
      it('should throw NotFoundException if subscription does not exist', async () => {
        service.findById = jest.fn().mockRejectedValue(new NotFoundException());
        await expect(service.getHistoricalUnitAmount(999)).rejects.toThrow(NotFoundException);
        expect(service.findById).toHaveBeenCalledWith(999);
      });



      describe('create', () => {
        it('creates a subscription with client, membership and active state (startDate defaults)', async () => {
          const dto: SubscriptionDto = { membershipId: 10 };
          const client = { id: 99 } as any;

          clientServiceMock.findById.mockResolvedValue(client);
          membershipServiceMock.findById.mockResolvedValue(membership);
          stateServiceMock.findActiveState.mockResolvedValue(activeState);
          const created = { id: undefined, client, membership, state: activeState } as any;
          repositoryMock.create!.mockReturnValue(created);
          repositoryMock.save!.mockResolvedValue({ ...created, id: 123 });

          const result = await service.create(dto, client.id);
          // Assert create called without explicit startDate
          expect(repositoryMock.create).toHaveBeenCalled();
          const createArg = (repositoryMock.create as jest.Mock).mock.calls[0][0];
          expect(createArg.startDate).toBeUndefined();
          expect(createArg).toMatchObject({ client, membership, state: activeState });
          expect(repositoryMock.save).toHaveBeenCalledWith(created);
          expect(result).toEqual({ ...created, id: 123 });
          expect(clientServiceMock.findById).toHaveBeenCalledWith(client.id);
          expect(membershipServiceMock.findById).toHaveBeenCalledWith(dto.membershipId);
          expect(stateServiceMock.findActiveState).toHaveBeenCalled();
        });
        it('propagates when clientService.findById throws', async () => {
          const dto: SubscriptionDto = { membershipId: 10 };
          clientServiceMock.findById.mockRejectedValue(new NotFoundException('client not found'));
          await expect(service.create(dto, 99)).rejects.toThrow(NotFoundException);
          expect(clientServiceMock.findById).toHaveBeenCalledWith(99);
        });
        it('propagates when membershipService.findById throws', async () => {
          const dto: SubscriptionDto = { membershipId: 10 };
          const client = { id: 99 } as any;
          clientServiceMock.findById.mockResolvedValue(client);
          membershipServiceMock.findById.mockRejectedValue(new NotFoundException('membership not found'));
          await expect(service.create(dto, client.id)).rejects.toThrow(NotFoundException);
        });
        it('propagates when stateService.findActiveState throws', async () => {
          const dto: SubscriptionDto = { membershipId: 10 };
          const client = { id: 99 } as any;
          clientServiceMock.findById.mockResolvedValue(client);
          membershipServiceMock.findById.mockResolvedValue(membership);
          stateServiceMock.findActiveState.mockRejectedValue(new NotFoundException('state not found'));
          await expect(service.create(dto, client.id)).rejects.toThrow(NotFoundException);
        });
        it('propagates when repository.save throws', async () => {
          const dto: SubscriptionDto = { membershipId: 10 };
          const client = { id: 99 } as any;
          clientServiceMock.findById.mockResolvedValue(client);
          membershipServiceMock.findById.mockResolvedValue(membership);
          stateServiceMock.findActiveState.mockResolvedValue(activeState);
          const created = { id: undefined, client, membership, state: activeState } as any;
          repositoryMock.create!.mockReturnValue(created);
          repositoryMock.save!.mockRejectedValue(new Error('DB save error'));
          await expect(service.create(dto, client.id)).rejects.toThrow('DB save error');
        });
      });
      /*
        async create(dto: SubscriptionDto, clientId: number): Promise<Subscription> {
            const { membershipId, ...subscriptionData } = dto;
            const client = await this.clientService.findById(clientId);
            const membership = await this.membershipService.findById(membershipId);
            const state = await this.stateService.findActiveState();
            const subscription = this.subscriptionRepository.create({
                ...subscriptionData,
                client,
                membership,
                state
            });
            return this.subscriptionRepository.save(subscription);
        } */

      describe('makeClientSubscriptionInactive', () => {
        it('deactivates current subscription for client', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.getClientCurrentSubscription = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findInactiveState.mockResolvedValue(inactiveState);
          repositoryMock.save!.mockResolvedValue({ ...sub, state: inactiveState });

          const res = await service.makeClientSubscriptionInactive(99);
          expect(service.getClientCurrentSubscription).toHaveBeenCalledWith(undefined, 99);
          expect(sub.state).toBe(inactiveState);
          expect(repositoryMock.save).toHaveBeenCalledWith(sub);
          expect(res).toEqual({ message: 'Subscription deactivated successfully' });
        });
        it('throws NotFoundException when client has no active subscription', async () => {
          service.getClientCurrentSubscription = jest.fn().mockRejectedValue(new NotFoundException('no subscription'));
          await expect(service.makeClientSubscriptionInactive(99)).rejects.toThrow(NotFoundException);
          expect(stateServiceMock.findInactiveState).not.toHaveBeenCalled();
          expect(repositoryMock.save).not.toHaveBeenCalled();
        });
        it('throws when findInactiveState throws', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.getClientCurrentSubscription = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findInactiveState.mockRejectedValue(new NotFoundException('state not found'));

          await expect(service.makeClientSubscriptionInactive(99)).rejects.toThrow(NotFoundException);
          expect(repositoryMock.save).not.toHaveBeenCalled();
        });
        it('propagates repository error on save', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.getClientCurrentSubscription = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findInactiveState.mockResolvedValue(inactiveState);
          repositoryMock.save!.mockRejectedValue(new Error('DB error'));
          await expect(service.makeClientSubscriptionInactive(99)).rejects.toThrow('DB error');
        });
      });

      //makeSubscriptionInactive,makeSubscriptionActive no los especifico tanto porque son similares al de makeSubscriptionSuspended

      describe('makeSubscriptionInactive', () => {
        it('sets subscription state to Inactive and saves', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findInactiveState.mockResolvedValue(inactiveState);
          repositoryMock.save!.mockResolvedValue({ ...sub, state: inactiveState });

          const updated = await service.makeSubscriptionInactive(1);
          expect(service.findById).toHaveBeenCalledWith(1);
          expect(sub.state).toBe(inactiveState);
          expect(repositoryMock.save).toHaveBeenCalledWith(sub);
          expect(updated.state).toBe(inactiveState);
        });
        it('throws NotFoundException when subscription not found', async () => {
          service.findById = jest.fn().mockRejectedValue(new NotFoundException());
          await expect(service.makeSubscriptionInactive(1)).rejects.toThrow(NotFoundException);
          expect(stateServiceMock.findInactiveState).not.toHaveBeenCalled();
          expect(repositoryMock.save).not.toHaveBeenCalled();
        });
        it('throws when findInactiveState throws', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findInactiveState.mockRejectedValue(new NotFoundException());
          await expect(service.makeSubscriptionInactive(1)).rejects.toThrow(NotFoundException);
          expect(repositoryMock.save).not.toHaveBeenCalled();
        });
        it('propagates repository error on save', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findInactiveState.mockResolvedValue(inactiveState);
          repositoryMock.save!.mockRejectedValue(new Error('DB error'));
          await expect(service.makeSubscriptionInactive(1)).rejects.toThrow('DB error');
        });
      });

      describe('makeSubscriptionActive', () => {
        it('sets subscription state to Active and saves', async () => {
          const sub = { ...baseSubscription, state: inactiveState } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findActiveState.mockResolvedValue(activeState);
          repositoryMock.save!.mockResolvedValue({ ...sub, state: activeState });

          const updated = await service.makeSubscriptionActive(1);
          expect(service.findById).toHaveBeenCalledWith(1);
          expect(sub.state).toBe(activeState);
          expect(repositoryMock.save).toHaveBeenCalledWith(sub);
          expect(updated.state).toBe(activeState);
        });
        it('throws NotFoundException when subscription not found', async () => {
          service.findById = jest.fn().mockRejectedValue(new NotFoundException());
          await expect(service.makeSubscriptionActive(1)).rejects.toThrow(NotFoundException);
          expect(stateServiceMock.findActiveState).not.toHaveBeenCalled();
          expect(repositoryMock.save).not.toHaveBeenCalled();
        });
        it('throws when findActiveState throws', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findActiveState.mockRejectedValue(new NotFoundException());
          await expect(service.makeSubscriptionActive(1)).rejects.toThrow(NotFoundException);
          expect(repositoryMock.save).not.toHaveBeenCalled();
        });
        it('propagates repository error on save', async () => {
          const sub = { ...baseSubscription } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findActiveState.mockResolvedValue(activeState);
          repositoryMock.save!.mockRejectedValue(new Error('DB error'));
          await expect(service.makeSubscriptionActive(1)).rejects.toThrow('DB error');
        });
      });

      describe('makeSubscriptionSuspended', () => {
        it('sets subscription state to Suspended and saves', async () => {
          const sub = { ...baseSubscription, state: activeState } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findSuspendedState.mockResolvedValue(suspendedState);
          repositoryMock.save!.mockResolvedValue({ ...sub, state: suspendedState });

          const updated = await service.makeSubscriptionSuspended(1);
          expect(service.findById).toHaveBeenCalledWith(1);
          expect(sub.state).toBe(suspendedState);
          expect(repositoryMock.save).toHaveBeenCalledWith(sub);
          expect(updated.state).toBe(suspendedState);
        });
        it('throws NotFoundException if subscription does not exist', async () => {
          service.findById = jest.fn().mockRejectedValue(new NotFoundException());

          await expect(service.makeSubscriptionSuspended(1)).rejects.toThrow(NotFoundException);
          expect(service.findById).toHaveBeenCalledWith(1);
          expect(repositoryMock.save).not.toHaveBeenCalled();
          expect(stateServiceMock.findSuspendedState).not.toHaveBeenCalled();
        });
        it('throws NotFoundException if state does not exist', async () => {
          service.findById = jest.fn().mockResolvedValue({ ...baseSubscription, state: activeState } as Subscription);
          stateServiceMock.findSuspendedState = jest.fn().mockRejectedValue(new NotFoundException());

          await expect(service.makeSubscriptionSuspended(1)).rejects.toThrow(NotFoundException);
          expect(service.findById).toHaveBeenCalledWith(1);
          expect(repositoryMock.save).not.toHaveBeenCalled();
        });
        it('propagates repository error on save', async () => {
          const sub = { ...baseSubscription, state: activeState } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);
          stateServiceMock.findSuspendedState.mockResolvedValue(suspendedState);
          repositoryMock.save!.mockRejectedValue(new Error('DB error'));
          await expect(service.makeSubscriptionSuspended(1)).rejects.toThrow('DB error');
        });
      });


      describe('validateUpToDatePayment', () => {
        it('suspends subscription when payments are not up to date', async () => {
          const sub = { ...baseSubscription } as Subscription;
          feeCollectionServiceMock.validateUpToDatePayment.mockResolvedValue(false);
          service.makeSubscriptionSuspended = jest.fn().mockResolvedValue({ ...sub, state: suspendedState });

          await service.validateUpToDatePayment(sub);
          expect(feeCollectionServiceMock.validateUpToDatePayment).toHaveBeenCalledWith(sub.id);
          expect(service.makeSubscriptionSuspended).toHaveBeenCalledWith(sub.id);
        });
        it('does not suspend subscription when payments are up to date', async () => {
          const sub = { ...baseSubscription } as Subscription;
          feeCollectionServiceMock.validateUpToDatePayment.mockResolvedValue(true);
          service.makeSubscriptionSuspended = jest.fn().mockResolvedValue({ ...sub, state: suspendedState });

          await service.validateUpToDatePayment(sub);
          expect(feeCollectionServiceMock.validateUpToDatePayment).toHaveBeenCalledWith(sub.id);
          expect(service.makeSubscriptionSuspended).not.toHaveBeenCalled();
        });
      });

      describe('isActive', () => {
        it('should return true if state is active', () => {
          stateServiceMock.isActive.mockReturnValue(true);
          const sub = { ...baseSubscription, state: activeState } as Subscription;
          const result = service.isActive(sub);
          expect(result).toBe(true);
          expect(stateServiceMock.isActive).toHaveBeenCalledWith(activeState);
        });
        it('should return false if state is inactive', () => {
          stateServiceMock.isActive.mockReturnValue(false);
          const sub = { ...baseSubscription, state: inactiveState } as Subscription;
          const result = service.isActive(sub);
          expect(result).toBe(false);
          expect(stateServiceMock.isActive).toHaveBeenCalledWith(inactiveState);
        });
      });

      describe('getAttendanceLimit', () => {
        it('returns membership weeklyAttendanceLimit', async () => {
          const sub = { ...baseSubscription, membership } as Subscription;
          service.findById = jest.fn().mockResolvedValue(sub);

          const limit = await service.getAttendanceLimit(sub.id);
          expect(limit).toBe(3);
          expect(service.findById).toHaveBeenCalledWith(sub.id);
        });
        it('should throw NotFoundException if subscription does not exist', async () => {
          service.findById = jest.fn().mockRejectedValue(new NotFoundException());
          await expect(service.getAttendanceLimit(999)).rejects.toThrow(NotFoundException);
          expect(service.findById).toHaveBeenCalledWith(999);
        });
      });
    });
  })
})