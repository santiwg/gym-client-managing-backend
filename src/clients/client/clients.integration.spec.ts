/**
 * Clients module integration tests (no mocks).
 *
 * What and why:
 * - We boot a real Nest testing module with the actual ClientsModule.
 * - We wire TypeORM to an in-memory SQLite DB so services/controllers hit a real DB.
 * - We seed required reference data (Gender, BloodType) via repositories.
 * - We exercise controller methods directly (no HTTP) to verify the module wiring end-to-end.
 *
 * Notes:
 * - Using SQLite ':memory:' avoids network and flakiness (ideal for CI).
 * - autoLoadEntities lets TypeORM auto-register entities from imported modules.
 * - We clear tables between tests for isolation and deterministic results.
 *
 * About spies (jest.spyOn):
 * - jest.spyOn(obj, 'method') wraps a real method so we can observe interactions (how many times it was called, arguments, order) without replacing its implementation.
 * - By default, a spy calls through to the original method (no mocking). This is perfect for integration tests where we want real behavior but still assert wiring.
 * - We use it here to verify which services/repositories are invoked on each path, and we reset them in beforeEach with jest.restoreAllMocks().
 * - If needed, you can change behavior with mockImplementation/ mockResolvedValue, but we avoid that here to keep tests "without mocks".
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, INestApplicationContext, NotFoundException } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import 'dotenv/config'; // loads .env.test
import { Client as PgClient } from 'pg';
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

describe('ClientsModule integration', () => {
    let moduleRef: TestingModule;
    let app: INestApplicationContext; //lighter than INestApplication, no HTTP server
    let dataSource: DataSource;
    // Use an isolated Postgres schema for this suite to avoid conflicts with E2E
    // and other test files running in parallel.
    let dbSchema: string;

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


    // Create schema if missing (safe to call repeatedly). This avoids races when
    // multiple Jest workers initialize TypeORM and the DB concurrently.
    const ensureSchema = async (schema: string) => {
        const url = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5433/gym_test';
        const client = new PgClient({ connectionString: url });
        await client.connect();
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
        await client.end();
    };

    beforeAll(async () => {
        // Derive a unique schema for this integration spec
        dbSchema = `int_${process.env.JEST_WORKER_ID || '1'}`;
        await ensureSchema(dbSchema);
        moduleRef = await Test.createTestingModule({
            imports: [
                // Real DB for tests: in-memory SQLite (fast, isolated)
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5433/gym_test',
                    // Isolate from other specs (especially E2E) by schema
                    schema: dbSchema,
                    ssl: false,
                    autoLoadEntities: true, // auto-register entities used by imported modules
                    synchronize: true,      // build schema for tests
                    dropSchema: true,       // drop on every connection start
                    logging: false,
                    // Fail fast to avoid long timeouts if DB is not reachable
                    retryAttempts: 0,
                }),
                ClientsModule, // import the real feature module
            ],
        }).compile();

        dataSource = moduleRef.get(DataSource);
        if (!dataSource.isInitialized) await dataSource.initialize(); // connects TypeORM


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
            // Optional: drop the isolated schema to leave DB clean
            try {
                await dataSource.query(`DROP SCHEMA IF EXISTS "${dbSchema}" CASCADE;`);
            } catch (_) {
                // ignore cleanup errors
            }
            await dataSource.destroy();
        }
        await moduleRef.close();
    });

    // Clear tables safely in Postgres (prevents FK errors from TRUNCATE without CASCADE)
    const clearDatabase = async () => {
        if ((dataSource.options as any).type === 'postgres') {
            // Truncate all tables known by TypeORM with CASCADE and reset IDs
            // Important: when a schema is used, Postgres requires quoting schema and table separately: "schema"."table"
            const tables = dataSource.entityMetadatas
                .map((m: any) => {
                    // Prefer metadata fields if available; fallback to splitting tablePath
                    const schema = m.schema || (typeof m.tablePath === 'string' && m.tablePath.includes('.') ? m.tablePath.split('.')[0] : undefined);
                    const table = m.tableName || (typeof m.tablePath === 'string' ? m.tablePath.split('.').slice(-1)[0] : undefined);
                    return schema ? `"${schema}"."${table}"` : `"${table}"`;
                })
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

    describe('create', () => {
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
            const svcCreateSpy = jest.spyOn(clientService, 'create');
            const genderSpy = jest.spyOn(genderService, 'findById');
            const bloodSpy = jest.spyOn(bloodTypeService, 'findById');
            const repoCreateSpy = jest.spyOn(clientRepo, 'create');
            const repoSaveSpy = jest.spyOn(clientRepo, 'save');
            const obsCreateSpy = jest.spyOn(obsRepo, 'create');
            const obsRemoveSpy = jest.spyOn(obsRepo, 'remove');

            const created = await controller.create(dto);

            expect(created.id).toBeDefined();
            expect(created.name).toBe('Santiago');
            expect(created.gender).toMatchObject({ id: refs.genderId });
            expect(created.bloodType).toMatchObject({ id: refs.bloodTypeId });
            // Birth date should persist and read back as date-only (string) or Date depending on transformer
            expect(String((created as any).birthDate)).toContain('2004-11-25');

            // Verify interactions
            expect(svcCreateSpy).toHaveBeenCalledWith(dto);
            expect(genderSpy).toHaveBeenCalledWith(refs.genderId);
            expect(bloodSpy).toHaveBeenCalledWith(refs.bloodTypeId);
            expect(repoCreateSpy).toHaveBeenCalled();
            expect(repoSaveSpy).toHaveBeenCalled();
            // observations repo should not be used on create path
            expect(obsCreateSpy).not.toHaveBeenCalled();
            expect(obsRemoveSpy).not.toHaveBeenCalled();
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
            const svcCreateSpy = jest.spyOn(clientService, 'create');
            const genderSpy = jest.spyOn(genderService, 'findById');
            await expect(controller.create(dto)).rejects.toThrow(NotFoundException);
            expect(svcCreateSpy).toHaveBeenCalled();
            expect(genderSpy).toHaveBeenCalledWith(999);
        });
    });

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
    });
});