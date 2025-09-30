// Test suite for ClientService
//
// Guía rápida de este spec:
// - Mockeamos los repositorios de Client y ClientObservation, y los servicios auxiliares.
// - Usamos expect.objectContaining para validar parcialmente opciones (evitar tests frágiles).
// - Aislamos helpers internos con spies o testeándolos en su propio bloque.
// - Cubrimos errores de repos y servicios para asegurar propagación correcta.
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientService } from './client.service';
import { Client } from './client.entity';
import { ClientObservation } from '../client-observation/observation.entity';
import { ClientGoalService } from '../client-goal/client-goal.service';
import { GenderService } from 'src/shared/gender/gender.service';
import { BloodTypeService } from 'src/shared/blood-type/blood-type.service';
import { PaginationService } from 'src/shared/pagination/pagination.service';

describe('ClientService', () => {
  let service: ClientService;

  // Repository mocks
  const clientRepoMock: Partial<Record<keyof Repository<Client>, jest.Mock>> = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };
  const clientObservationRepoMock: Partial<Record<keyof Repository<ClientObservation>, jest.Mock>> = {
    create: jest.fn(),
    remove: jest.fn(),
  };

  // Dependency service mocks
  const clientGoalServiceMock = { findById: jest.fn() };
  const genderServiceMock = { findById: jest.fn() };
  const bloodTypeServiceMock = { findById: jest.fn() };
  const paginationServiceMock = {
    getPaginationOptions: jest.fn(),
    createPaginatedResponse: jest.fn(),
  };

  const baseClient: Client = {
    id: 1,
    name: 'John',
    documentNumber: '123',
    observations: [],
  } as any;

  beforeEach(async () => {
    // Reset all mocks similar to your other spec
    jest.clearAllMocks();
    Object.values(clientRepoMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(clientObservationRepoMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(clientGoalServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(genderServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(bloodTypeServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());
    Object.values(paginationServiceMock).forEach((fn) => fn && fn.mockReset && fn.mockReset());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: getRepositoryToken(Client), useValue: clientRepoMock },
        { provide: getRepositoryToken(ClientObservation), useValue: clientObservationRepoMock },
        { provide: ClientGoalService, useValue: clientGoalServiceMock },
        { provide: GenderService, useValue: genderServiceMock },
        { provide: BloodTypeService, useValue: bloodTypeServiceMock },
        { provide: PaginationService, useValue: paginationServiceMock },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all clients', async () => {
      const clients = [{ ...baseClient }, { ...baseClient, id: 2 }];
      clientRepoMock.find!.mockResolvedValue(clients);
      const result = await service.findAll();
      expect(result).toEqual(clients);
      expect(clientRepoMock.find).toHaveBeenCalled();
    });
    it('propagates repository errors', async () => {
      clientRepoMock.find!.mockRejectedValue(new Error('DB error'));
      await expect(service.findAll()).rejects.toThrow('DB error');
    });
  });

  describe('findAllPaginated', () => {
    it('returns paginated response', async () => {
      const pagination = { page: 1, quantity: 10 } as any;
      const options = { take: 10, skip: 0 } as any;
      const data = [{ ...baseClient }];
      paginationServiceMock.getPaginationOptions.mockReturnValue(options);
      clientRepoMock.findAndCount!.mockResolvedValue([data, 1]);
      paginationServiceMock.createPaginatedResponse.mockReturnValue({ data, hasMore: true });

      const result = await service.findAllPaginated(pagination);
      expect(paginationServiceMock.getPaginationOptions).toHaveBeenCalledWith(pagination, expect.objectContaining({
        order: { name: 'ASC' },
        relations: [
          'subscriptions',
          'observations',
          'clientGoal',
          'gender',
          'bloodType',
        ],
      }));
      expect(clientRepoMock.findAndCount).toHaveBeenCalledWith(options);
      expect(paginationServiceMock.createPaginatedResponse).toHaveBeenCalledWith(data, 1, pagination);
      expect(result).toEqual({ data, hasMore: true });
    });
    it('propagates when getPaginationOptions throws', async () => {
      const pagination = { page: 1, quantity: 10 } as any;
      paginationServiceMock.getPaginationOptions.mockImplementation(() => { throw new Error('pagination error'); });
      await expect(service.findAllPaginated(pagination)).rejects.toThrow('pagination error');
      expect(clientRepoMock.findAndCount).not.toHaveBeenCalled();
    });
    it('propagates when repository.findAndCount throws', async () => {
      const pagination = { page: 1, quantity: 10 } as any;
      const options = { take: 10, skip: 0 } as any;
      paginationServiceMock.getPaginationOptions.mockReturnValue(options);
      clientRepoMock.findAndCount!.mockRejectedValue(new Error('DB error'));
      await expect(service.findAllPaginated(pagination)).rejects.toThrow('DB error');
      expect(paginationServiceMock.createPaginatedResponse).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns a client when found', async () => {
      const client = { ...baseClient, subscriptions: [], observations: [], clientGoal: {}, gender: {}, bloodType: {} } as any;
      clientRepoMock.findOne!.mockResolvedValue(client);
      const result = await service.findById(1);
      expect(result).toBe(client);
      expect(clientRepoMock.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    });
    it('throws NotFoundException when client does not exist', async () => {
      clientRepoMock.findOne!.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 999 } }));
    });
    it('propagates repository errors', async () => {
      clientRepoMock.findOne!.mockRejectedValue(new Error('DB error'));
      await expect(service.findById(5)).rejects.toThrow('DB error');
    });
  });

  describe('findByDocumentNumber', () => {
    it('returns a client with relations', async () => {
      const client = { ...baseClient, subscriptions: [], observations: [], clientGoal: {}, gender: {}, bloodType: {} } as any;
      clientRepoMock.findOne!.mockResolvedValue(client);
      const result = await service.findByDocumentNumber('123');
      expect(result).toBe(client);
      expect(clientRepoMock.findOne).toHaveBeenCalledWith({
        where: { documentNumber: '123' },
        relations: ['subscriptions', 'observations', 'clientGoal', 'gender', 'bloodType'],
      });
    });
    it('throws NotFoundException when client does not exist', async () => {
      clientRepoMock.findOne!.mockResolvedValue(null);
      await expect(service.findByDocumentNumber('x')).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.findOne).toHaveBeenCalledWith({
        where: { documentNumber: 'x' },
        relations: ['subscriptions', 'observations', 'clientGoal', 'gender', 'bloodType'],
      });
    });
    it('propagates repository errors', async () => {
      clientRepoMock.findOne!.mockRejectedValue(new Error('DB error'));
      await expect(service.findByDocumentNumber('y')).rejects.toThrow('DB error');
    });
  });

  describe('create', () => {
    it('creates a client without clientGoalId', async () => {
      const birthDate = new Date('1990-01-01');
      const dto: any = { name: 'John', genderId: 1, bloodTypeId: 2, birthDate, clientObservations: [{ summary: 's', comment: 'c' }, { summary: 'a', comment: 'c' }] };
      const gender = { id: 1 } as any;
      const bloodType = { id: 2 } as any;
      const observations = [{ summary: 's', comment: 'c' }, { summary: 'a', comment: 'c' }];
      genderServiceMock.findById.mockResolvedValue(gender);
      bloodTypeServiceMock.findById.mockResolvedValue(bloodType);
      // isolate: mock createClientObservations
      const spyCreateObs = jest.spyOn(service, 'createClientObservations').mockReturnValue(observations as any);

      // createClientObservations is a pure helper; we invoke it via the service (not directly).
      const created = { ...dto, gender, clientGoal: undefined, observations, bloodType } as any;
      clientRepoMock.create!.mockReturnValue(created);
      clientRepoMock.save!.mockResolvedValue({ ...created, id: 10 });

      const result = await service.create(dto);
      expect(spyCreateObs).toHaveBeenCalledWith(dto.clientObservations);
      expect(genderServiceMock.findById).toHaveBeenCalledWith(dto.genderId);
      expect(bloodTypeServiceMock.findById).toHaveBeenCalledWith(dto.bloodTypeId);
  expect(clientGoalServiceMock.findById).not.toHaveBeenCalled();
  expect(clientRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({ birthDate }));
      // repo for observations should not be used in create path
      expect(clientObservationRepoMock.create).not.toHaveBeenCalled();
      expect(clientObservationRepoMock.remove).not.toHaveBeenCalled();
      expect(clientRepoMock.create).toHaveBeenCalled();
      expect(clientRepoMock.save).toHaveBeenCalledWith(created);
      expect(result).toEqual({ ...created, id: 10 });
      expect(result.birthDate).toEqual(birthDate);
    });

    it('creates a client with clientGoalId', async () => {
      const birthDate = new Date('1992-02-02');
      const dto: any = { name: 'Jane', genderId: 1, bloodTypeId: 2, clientGoalId: 7, birthDate };
      const gender = { id: 1 } as any;
      const bloodType = { id: 2 } as any;
      const clientGoal = { id: 7 } as any;
      genderServiceMock.findById.mockResolvedValue(gender);
      bloodTypeServiceMock.findById.mockResolvedValue(bloodType);
      clientGoalServiceMock.findById.mockResolvedValue(clientGoal);
      const created = { id: undefined, ...dto, gender, clientGoal, observations: [], bloodType } as any;
      clientRepoMock.create!.mockReturnValue(created);
      clientRepoMock.save!.mockResolvedValue({ ...created, id: 11 });

      const result = await service.create(dto);
      expect(clientGoalServiceMock.findById).toHaveBeenCalledWith(dto.clientGoalId);
      expect(clientRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({ birthDate }));
      expect(result.id).toBe(11);
      expect(result.birthDate).toEqual(birthDate);
    });

    it('propagates when genderService.findById throws', async () => {
      const dto: any = { name: 'John', genderId: 1, bloodTypeId: 2 };
      genderServiceMock.findById.mockRejectedValue(new NotFoundException('gender not found'));
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.save).not.toHaveBeenCalled();
    });

    it('propagates when clientGoalService.findById throws', async () => {
      const dto: any = { name: 'John', genderId: 1, bloodTypeId: 2, clientGoalId: 9 };
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      bloodTypeServiceMock.findById.mockResolvedValue({ id: 2 });
      clientGoalServiceMock.findById.mockRejectedValue(new NotFoundException('goal not found'));
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.save).not.toHaveBeenCalled();
    });

    it('propagates when bloodTypeService.findById throws', async () => {
      const dto: any = { name: 'John', genderId: 1, bloodTypeId: 2 };
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      bloodTypeServiceMock.findById.mockRejectedValue(new NotFoundException('blood type not found'));
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.save).not.toHaveBeenCalled();
    });

    it('propagates when repository.save throws', async () => {
      const dto: any = { name: 'John', genderId: 1, bloodTypeId: 2 };
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      bloodTypeServiceMock.findById.mockResolvedValue({ id: 2 });
      const created = { id: undefined } as any;
      clientRepoMock.create!.mockReturnValue(created);
      clientRepoMock.save!.mockRejectedValue(new Error('DB save error'));
      await expect(service.create(dto)).rejects.toThrow('DB save error');
    });
  });

  describe('createClientObservations', () => {
    it('maps observations to partials', () => {
      const input = [
        { summary: 'S1', comment: 'C1', date: new Date('2020-01-01') },
        { summary: 'S2' },
      ] as any;
      const result = service.createClientObservations(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ summary: 'S1', comment: 'C1' });
      expect(result[1]).toMatchObject({ summary: 'S2' });
    });
    it('returns empty array when no observations provided', () => {
      const result = service.createClientObservations([]);
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('soft removes existing client and returns message', async () => {
      const client = { ...baseClient } as Client;
      // Use real service.findById to hit repository
      clientRepoMock.findOne!.mockResolvedValue(client);
      clientRepoMock.softRemove!.mockResolvedValue(client);
      const res = await service.delete(client.id);
      expect(clientRepoMock.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: client.id } }));
      expect(clientRepoMock.softRemove).toHaveBeenCalledWith(client);
      expect(res).toEqual({ message: `Client with ID ${client.id} deleted successfully` });
    });
    it('throws NotFoundException when client does not exist', async () => {
      clientRepoMock.findOne!.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.softRemove).not.toHaveBeenCalled();
    });
    it('propagates repository error on softRemove', async () => {
      const client = { ...baseClient } as Client;
      clientRepoMock.findOne!.mockResolvedValue(client);
      clientRepoMock.softRemove!.mockRejectedValue(new Error('DB error'));
      await expect(service.delete(client.id)).rejects.toThrow('DB error');
    });
  });

  describe('update', () => {
    it('updates basic fields, resolves deps, updates observations efficiently, and saves', async () => {
      const existing: any = {
        id: 1, name: 'Old', observations: [
          { summary: 'old1', comment: 'c1', date: new Date('2020-01-01') },
          { summary: 'stay', comment: 'old', date: new Date('2020-02-02') },
        ]
      };
      const dto: any = {
        name: 'New', genderId: 1, bloodTypeId: 2, clientGoalId: 7,
        clientObservations: [
          { summary: 'stay', comment: 'new' }, // should update existing
          { summary: 'newOne', comment: 'c' }, // should be created
        ],
      };
      clientRepoMock.findOne!.mockResolvedValue(existing);
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      bloodTypeServiceMock.findById.mockResolvedValue({ id: 2 });
      clientGoalServiceMock.findById.mockResolvedValue({ id: 7 });
      // mock private method to isolate update from its internals
      const spyUpdateObs = jest
        .spyOn(service as any, 'updateClientObservationsEfficiently')
        .mockResolvedValue(undefined);
      // save returns a persisted object we can assert on
      const persisted = { ...existing, name: 'New', gender: { id: 1 }, bloodType: { id: 2 }, clientGoal: { id: 7 } };
      clientRepoMock.save!.mockResolvedValue(persisted);

      const saved = await service.update(existing.id, dto);
      // El helper privado fue invocado con los argumentos correctos
      expect(spyUpdateObs).toHaveBeenCalledWith(existing, dto.clientObservations);
      // Guardado con campos actualizados y devuelve el persistido
      expect(clientRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'New' }));
      expect(saved).toBe(persisted);
      expect(saved).toMatchObject({ name: 'New', gender: { id: 1 }, bloodType: { id: 2 }, clientGoal: { id: 7 } });
      // since internals are mocked, do not assert on observations mutation here
      // Como los internals están mockeados, no afirmamos cambios en observations aquí
    });

    it('clears observations when none provided and saves', async () => {
      const existing: any = { id: 1, name: 'Old', observations: [{ summary: 'x' }] };
      const dto: any = { name: 'New', genderId: 1, bloodTypeId: 2 };
      clientRepoMock.findOne!.mockResolvedValue(existing);
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      bloodTypeServiceMock.findById.mockResolvedValue({ id: 2 });
      const spyUpdateObs = jest
        .spyOn(service as any, 'updateClientObservationsEfficiently')
        .mockResolvedValue(undefined);
      clientRepoMock.save!.mockImplementation(async (obj: any) => obj);

      const saved = await service.update(existing.id, dto);
      expect(saved.observations).toEqual([]);
      expect(clientObservationRepoMock.remove).not.toHaveBeenCalled();
      expect(clientObservationRepoMock.create).not.toHaveBeenCalled();
      expect(spyUpdateObs).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when client does not exist', async () => {
      clientRepoMock.findOne!.mockResolvedValue(null);
      await expect(service.update(999, { genderId: 1, bloodTypeId: 2 } as any)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.save).not.toHaveBeenCalled();
    });

    it('propagates when genderService.findById throws', async () => {
      clientRepoMock.findOne!.mockResolvedValue({ id: 1, observations: [] });
      genderServiceMock.findById.mockRejectedValue(new NotFoundException());
      await expect(service.update(1, { genderId: 1, bloodTypeId: 2 } as any)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.save).not.toHaveBeenCalled();
    });

    it('propagates when clientGoalService.findById throws (when provided)', async () => {
      clientRepoMock.findOne!.mockResolvedValue({ id: 1, observations: [] });
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      clientGoalServiceMock.findById.mockRejectedValue(new NotFoundException());
      bloodTypeServiceMock.findById.mockResolvedValue({ id: 2 });
      await expect(service.update(1, { genderId: 1, bloodTypeId: 2, clientGoalId: 9 } as any)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.save).not.toHaveBeenCalled();
    });

    it('propagates when bloodTypeService.findById throws', async () => {
      clientRepoMock.findOne!.mockResolvedValue({ id: 1, observations: [] });
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      bloodTypeServiceMock.findById.mockRejectedValue(new NotFoundException());
      await expect(service.update(1, { genderId: 1, bloodTypeId: 2 } as any)).rejects.toThrow(NotFoundException);
      expect(clientRepoMock.save).not.toHaveBeenCalled();
    });

    it('propagates repository error on save', async () => {
      clientRepoMock.findOne!.mockResolvedValue({ id: 1, observations: [] });
      genderServiceMock.findById.mockResolvedValue({ id: 1 });
      bloodTypeServiceMock.findById.mockResolvedValue({ id: 2 });
      clientRepoMock.save!.mockRejectedValue(new Error('DB error'));
      await expect(service.update(1, { genderId: 1, bloodTypeId: 2 } as any)).rejects.toThrow('DB error');
    });
  });

  describe('updateClientObservationsEfficiently (isolated)', () => {
    it('removes missing, updates existing, creates new observations', async () => {
      const client: any = {
        observations: [
          { summary: 'old1', comment: 'c1', date: new Date('2020-01-01') },
          { summary: 'stay', comment: 'old', date: new Date('2020-02-02') },
        ]
      };
      const newObs: any[] = [
        { summary: 'stay', comment: 'new' },
        { summary: 'newOne', comment: 'c' },
      ];
      clientObservationRepoMock.remove!.mockResolvedValue(undefined);
      clientObservationRepoMock.create!.mockImplementation((o: any) => ({ ...o }));

      await (service as any).updateClientObservationsEfficiently(client, newObs);

      expect(clientObservationRepoMock.remove).toHaveBeenCalledWith([
        { summary: 'old1', comment: 'c1', date: new Date('2020-01-01') },
      ]);
      // created newOne
      expect(clientObservationRepoMock.create).toHaveBeenCalledWith({ summary: 'newOne', comment: 'c', date: expect.any(Date) });
      // updated 'stay'
      const stay = client.observations.find((o: any) => o.summary === 'stay');
      expect(stay.comment).toBe('new');
      expect(stay.date).toEqual(expect.any(Date));
      // final set contains stay + newOne
      const summaries = client.observations.map((o: any) => o.summary).sort();
      expect(summaries).toEqual(['newOne', 'stay']);
    });

    it('propagates repository remove error', async () => {
      const client: any = { observations: [{ summary: 'old1' }] };
      const newObs: any[] = [{ summary: 'stay' }];
      clientObservationRepoMock.remove!.mockRejectedValue(new Error('DB remove error'));
      await expect((service as any).updateClientObservationsEfficiently(client, newObs)).rejects.toThrow('DB remove error');
    });
  });
});

