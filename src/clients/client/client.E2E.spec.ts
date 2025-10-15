import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, INestApplicationContext, NotFoundException } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import 'dotenv/config'; // loads .env.test
import { ClientsModule } from '../clients.module';
import { ClientController } from './client.controller';
import { Client } from './client.entity';
import { ClientService } from './client.service';
import { Gender } from '../../shared/gender/gender.entity';
import { GenderService } from '../../shared/gender/gender.service';
import { BloodType } from '../../shared/blood-type/blood-type.entity';
import { BloodTypeService } from '../../shared/blood-type/blood-type.service';
import { ClientGoal } from '../client-goal/client-goal.entity';
import { ClientGoalService } from '../client-goal/client-goal.service';
import { ClientObservation } from '../client-observation/observation.entity';
import { Subscription } from '../subscription/subscription.entity';
import { FeeCollection } from '../fee-collection/fee-collection.entity';
import { Attendance } from '../attendance/attendance.entity';
import { PaginationService } from '../../shared/pagination/pagination.service';
import * as request from 'supertest';
import { response } from 'express';

describe('ClientsModule e2e', () => {
    let moduleRef: TestingModule;
    let app: INestApplication; //lighter than INestApplication, no HTTP server
    let dataSource: DataSource;

    // We call controller methods directly to test module wiring (controller->service->repo->DB)
    let controller: ClientController;
    // Services resolved to assert interactions
    let clientService: ClientService;
    let genderService: GenderService;
    let bloodTypeService: BloodTypeService;
    let clientGoalService: ClientGoalService;
    let paginationService: PaginationService;

    // Repositories to seed/clear data
    let clientRepo: Repository<Client>;
    let genderRepo: Repository<Gender>;
    let bloodTypeRepo: Repository<BloodType>;
    let clientGoalRepo: Repository<ClientGoal>;
    let obsRepo: Repository<ClientObservation>;
    let subRepo: Repository<Subscription>;
    let feeRepo: Repository<FeeCollection>;
    let attRepo: Repository<Attendance>;

    jest.setTimeout(30000); // integration boot + DB may take longer than 5s


    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                // Real DB for tests: in-memory SQLite (fast, isolated)
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5433/gym_test',
                    ssl: false,
                    autoLoadEntities: true, // auto-register entities used by imported modules
                    synchronize: true,      // build schema for tests
                    dropSchema: true,       // drop on every connection start
                    logging: false,
                    retryAttempts: 5,
                    retryDelay: 1000,
                }),
                ClientsModule, // import the real feature module
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
        dataSource = moduleRef.get(DataSource);

        // Resolve controller, services and repositories for seeding/cleanup
        controller = moduleRef.get(ClientController);
        clientService = moduleRef.get(ClientService);
        genderService = moduleRef.get(GenderService);
        bloodTypeService = moduleRef.get(BloodTypeService);
        clientGoalService = moduleRef.get(ClientGoalService);
        paginationService = moduleRef.get(PaginationService);

        clientRepo = moduleRef.get(getRepositoryToken(Client));
        genderRepo = moduleRef.get(getRepositoryToken(Gender));
        bloodTypeRepo = moduleRef.get(getRepositoryToken(BloodType));
        clientGoalRepo = moduleRef.get(getRepositoryToken(ClientGoal));
        obsRepo = moduleRef.get(getRepositoryToken(ClientObservation));
        subRepo = moduleRef.get(getRepositoryToken(Subscription));
        feeRepo = moduleRef.get(getRepositoryToken(FeeCollection));
        attRepo = moduleRef.get(getRepositoryToken(Attendance));
    });

    afterAll(async () => {
        // Proper teardown avoids Jest open handle leaks
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
        }
        await moduleRef.close();
    });

    // Clear tables safely in Postgres (prevents FK errors from TRUNCATE without CASCADE)
    const clearDatabase = async () => {
        if ((dataSource.options as any).type === 'postgres') {
            // Truncate all tables known by TypeORM with CASCADE and reset IDs
            const tables = dataSource.entityMetadatas
                .map((m) => `"${m.tablePath}"`) // includes schema if applicable
                .join(', ');
            if (tables.length > 0) {
                await dataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
            }
            return;
        }

        // Fallback for other drivers: use DELETE in dependency order
        await attRepo.delete({});
        await feeRepo.delete({});
        await subRepo.delete({});
        await obsRepo.delete({});
        await clientRepo.delete({});
        await clientGoalRepo.delete({});
        await genderRepo.delete({});
        await bloodTypeRepo.delete({});
    };

    // Minimal seeding for valid client creation
    const seedRefs = async () => {
        const gender: Gender = genderRepo.create({ id: 1, name: 'Male' });
        const blood: BloodType = bloodTypeRepo.create({ id: 1, name: 'A+' });
        await genderRepo.save(gender);
        await bloodTypeRepo.save(blood);
        return { genderId: gender.id, bloodTypeId: blood.id };
        // Note: IDs are returned for DTOs; services will resolve full relations
    };

    beforeEach(async () => {
        jest.restoreAllMocks();
        await clearDatabase();
    });

    describe('/client (POST)', () => {
        it('creates a client with required relations', async () => {
            const refs = await seedRefs();

            // Use date-only string to align with date-only transformer (no time shift)
            const dto: any = {
                name: 'Santiago',
                lastName: 'Wursten',
                genderId: refs.genderId,
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'DOC-001',
                email: 'user@example.com',
                phoneNumber: '123',
                address: 'Street 123',
                birthDate: '2004-11-25',
                clientObservations: [{ summary: 'note', comment: 'first' }],
            };

            // Spies: service and repositories used during creation

            return request(app.getHttpServer())
                .post('/client')
                .send(dto)
                .expect(201)
                .expect(res => {
                    const created = res.body;
                    expect(created.id).toBeDefined();
                    expect(created.name).toBe('Santiago');
                    expect(created.gender).toMatchObject({ id: refs.genderId });
                    expect(created.bloodType).toMatchObject({ id: refs.bloodTypeId });
                    expect(String((created as any).birthDate)).toContain('2004-11-25');
                });

        });

        it('fails when gender does not exist', async () => {
            const refs = await seedRefs();
            const dto: any = {
                name: 'X',
                lastName: 'Y',
                genderId: 999, // invalid on purpose
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'DOC-ERR',
                email: 'err@example.com',
                birthDate: '2000-01-01',
            };
            return request(app.getHttpServer())
                .post('/client')
                .send(dto)
                .expect(404)
        });
        it('fails when dto is incorrect', async () => {
            const refs = await seedRefs();
            const dto: any = {
                name: 'X',
                lastName: 'Y',
                genderId: 999, // invalid on purpose
                //commented properties will be missing in
                //bloodTypeId: refs.bloodTypeId,
                //documentNumber: 'DOC-ERR',
                email: 'err@example.com',
                birthDate: '2000-01-01',
            };
            return request(app.getHttpServer())
                .post('/client')
                .send(dto)
                .expect(400)
        });
    });
    /*
    describe('findAllPaginated', () => {
        it('returns clients with pagination', async () => {
            const refs = await seedRefs();
            // Seed a couple of clients
            await controller.create({
                name: 'A',
                lastName: 'One',
                genderId: refs.genderId,
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'D1',
                email: 'a@e.com',
                birthDate: '1990-01-01',
            } as any);
            await controller.create({
                name: 'B',
                lastName: 'Two',
                genderId: refs.genderId,
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'D2',
                email: 'b@e.com',
                birthDate: '1991-02-02',
            } as any);

            const getOptsSpy = jest.spyOn(paginationService, 'getPaginationOptions');
            const createRespSpy = jest.spyOn(paginationService, 'createPaginatedResponse');
            const repoFindCountSpy = jest.spyOn(clientRepo, 'findAndCount');

            const page = await controller.findAllPaginated({ page: 1, quantity: 1 } as any);
            expect(page.data.length).toBe(1);
            expect(page.hasMore).toBe(true);
            const page2 = await controller.findAllPaginated({ page: 2, quantity: 1 } as any);
            expect(page2.hasMore).toBe(false); // only 2 seeded

            const names = [page.data[0].name, page2.data[0].name].sort();
            expect(names).toEqual(['A', 'B']);

            // Verify pagination & repo interactions
            expect(getOptsSpy).toHaveBeenCalled();
            expect(repoFindCountSpy).toHaveBeenCalled();
            expect(createRespSpy).toHaveBeenCalled();
        });
        it('returns empty page when no clients', async () => {
            //We do not seed any client
            const page = await controller.findAllPaginated({ page: 1, quantity: 10 } as any);
            expect(page.data).toEqual([]);
            expect(page.hasMore).toBe(false);
        });
    });

    describe('update', () => {
        it('updates client basic fields and relations', async () => {
            const refs = await seedRefs();
            // Seed goal to relate later
            const goal = await clientGoalRepo.save(clientGoalRepo.create({ name: 'Lose weight' }));

            const created = await controller.create({
                name: 'Old',
                lastName: 'Name',
                genderId: refs.genderId,
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'U1',
                email: 'u1@e.com',
                birthDate: '1999-09-09',
                clientObservations: [{ summary: 'keep', comment: 'c' }],
            } as any);

            const svcUpdateSpy = jest.spyOn(clientService, 'update');
            const genderSpy = jest.spyOn(genderService, 'findById');
            const bloodSpy = jest.spyOn(bloodTypeService, 'findById');
            const goalSpy = jest.spyOn(clientGoalService, 'findById');
            const repoFindOneSpy = jest.spyOn(clientRepo, 'findOne');
            const repoSaveSpy = jest.spyOn(clientRepo, 'save');
            const obsRemoveSpy = jest.spyOn(obsRepo, 'remove');
            const obsCreateSpy = jest.spyOn(obsRepo, 'create');

            const updated = await controller.update(created.id, {
                name: 'New',
                lastName: 'Name2',
                genderId: refs.genderId,
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'U1',
                email: 'u1@e.com',
                phoneNumber: '321',
                address: 'Street 456',
                birthDate: '2000-01-01',
                clientGoalId: goal.id,
                clientObservations: [{ summary: 'new', comment: 'c' }],
            } as any);
            expect(updated.name).toBe('New');
            expect(updated.clientGoal).toMatchObject({ id: goal.id });
            // Service handles observations efficiently; final list should contain latest set
            expect(Array.isArray(updated.observations)).toBe(true);

            // Verify interactions
            expect(svcUpdateSpy).toHaveBeenCalled();
            expect(genderSpy).toHaveBeenCalledWith(refs.genderId);
            expect(bloodSpy).toHaveBeenCalledWith(refs.bloodTypeId);
            expect(goalSpy).toHaveBeenCalledWith(goal.id);
            expect(repoFindOneSpy).toHaveBeenCalled();
            expect(repoSaveSpy).toHaveBeenCalled();
            // observations helper removes old and creates new
            expect(obsRemoveSpy).toHaveBeenCalled();
            expect(obsCreateSpy).toHaveBeenCalled();
        });

        it('throws NotFound when client does not exist', async () => {
            await seedRefs();
            //We do not seed a client
            await expect(controller.update(999 as any, { name: 'X' } as any)).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('soft deletes a client and prevents future reads', async () => {
            const refs = await seedRefs();
            const created = await controller.create({
                name: 'Del',
                lastName: 'Me',
                genderId: refs.genderId,
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'DEL1',
                email: 'del@e.com',
                birthDate: '1980-05-05',
            } as any);

            const svcDeleteSpy = jest.spyOn(clientService, 'delete');
            const repoFindOneSpy = jest.spyOn(clientRepo, 'findOne');
            const repoSoftRemoveSpy = jest.spyOn(clientRepo, 'softRemove');

            const res = await controller.delete(created.id as any);
            expect(res).toEqual({ message: `Client with ID ${created.id} deleted successfully` });

            // Attempting to load should now fail (service.findById throws NotFound)
            await expect(controller.update(created.id as any, { name: 'ShouldFail' } as any)).rejects.toThrow(NotFoundException);

            // Verify interactions
            expect(svcDeleteSpy).toHaveBeenCalledWith(created.id);
            expect(repoFindOneSpy).toHaveBeenCalled();
            expect(repoSoftRemoveSpy).toHaveBeenCalled();
        });
    });*/
});