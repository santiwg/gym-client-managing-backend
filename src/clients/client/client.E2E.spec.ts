import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor, INestApplication, INestApplicationContext, NotFoundException, ValidationPipe } from '@nestjs/common';
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
import * as request from 'supertest';
import { response } from 'express';
import { GlobalExceptionFilter } from 'src/shared/filters/global-exception.filter';
import { Reflector } from '@nestjs/core';

describe('ClientsModule e2e', () => {
    /**
     * End-to-end (E2E) tests for Clients module.
     * - Spins up a real Nest application and hits HTTP routes with supertest.
     * - Uses Postgres with synchronize + dropSchema for an isolated DB per run.
     * - Enables global ValidationPipe so invalid DTOs/queries return 400 Bad Request.
     * - No spies: we assert on HTTP status codes and response payloads.
     */
    let moduleRef: TestingModule;
    let app: INestApplication; //lighter than INestApplication, no HTTP server
    let dataSource: DataSource;
    // Each suite uses its own Postgres schema to avoid cross-test interference
    // when running test files in parallel (isolates synchronize/dropSchema work).
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
        // Use a per-worker schema to isolate this E2E suite
        dbSchema = `e2e_${process.env.JEST_WORKER_ID || '1'}`;
        await ensureSchema(dbSchema);
        moduleRef = await Test.createTestingModule({
            imports: [
                // Real DB for tests: in-memory SQLite (fast, isolated)
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5433/gym_test',
                    // Isolate this suite by schema to prevent conflicts with other specs
                    schema: dbSchema,
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
        // Validate DTOs and query params, and strip unknown fields
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        //tests validate error format
        app.useGlobalFilters(new GlobalExceptionFilter());

        // @Exclude/@Expose affect the response
        app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
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
            // Optional: drop the isolated schema so each run starts fresh
            try {
                await dataSource.query(`DROP SCHEMA IF EXISTS "${dbSchema}" CASCADE;`);
            } catch (_) {
                // ignore cleanup errors
            }
            await dataSource.destroy();
        }
        await app.close();
        await moduleRef.close();
    });

    // Clear tables safely in Postgres (prevents FK errors from TRUNCATE without CASCADE)
    const clearDatabase = async () => {
        if ((dataSource.options as any).type === 'postgres') {
            // Truncate all tables known by TypeORM with CASCADE and reset IDs
            // Important: when a schema is used, Postgres requires quoting schema and table separately: "schema"."table"
            const tables = dataSource.entityMetadatas
                .map((m: any) => {
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

    // Fast fixture to insert a Client directly via repositories (avoid POST when not the focus)
    /**
     * overrides lets you replace any default field used by this fixture.
     * - Type: Partial<Client> (entity shape, not DTO).
     * - Precedence: values in overrides win over the defaults below.
     * - You may override primitives (name, documentNumber, birthDate)
     *   or relations (gender, bloodType, clientGoal) by passing entities.
     * Returns the created client's id.
     */
    const createClientFixture = async (overrides: Partial<Client> = {}) => {
        const { genderId, bloodTypeId } = await seedRefs();
        const gender = await genderRepo.findOneByOrFail({ id: genderId });
        const bloodType = await bloodTypeRepo.findOneByOrFail({ id: bloodTypeId });
        const entity = clientRepo.create({
            name: 'User',
            lastName: 'Test',
            gender,
            bloodType,
            documentNumber: `DOC-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            email: `u${Date.now()}${Math.random().toString(16).slice(2)}@e.com`,
            phoneNumber: '123',
            address: 'Street 123',
            birthDate: '2000-01-01' as any,
            ...overrides,
        } as any);
    const saved: Client = await clientRepo.save(entity as any);
    return saved.id;
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
    describe('/client (GET)', () => {
        it('returns clients with pagination', async () => {
            // Arrange two clients directly (faster, not testing POST here)
            await createClientFixture({ name: 'A', lastName: 'One', birthDate: '1990-01-01' as any });
            await createClientFixture({ name: 'B', lastName: 'Two', birthDate: '1991-02-02' as any });

            const res1 = await request(app.getHttpServer())
                .get('/client')
                .query({ page: 1, quantity: 1 })
                .expect(200);
            expect(res1.body.data.length).toBe(1);
            expect(res1.body.hasMore).toBe(true);

            const res2 = await request(app.getHttpServer())
                .get('/client')
                .query({ page: 2, quantity: 1 })
                .expect(200);
            expect(res2.body.hasMore).toBe(false); // only 2 seeded

            const names = [res1.body.data[0].name, res2.body.data[0].name].sort();
            expect(names).toEqual(['A', 'B']);
        });

        it('returns empty page when no clients', async () => {
            //We do not seed any client
            const res = await request(app.getHttpServer())
                .get('/client')
                .query({ page: 1, quantity: 10 })
                .expect(200);
            expect(res.body.data).toEqual([]);
            expect(res.body.hasMore).toBe(false);
        });

        it('returns 400 when query params are invalid', async () => {
            await request(app.getHttpServer())
                .get('/client')
                .query({ page: 'foo', quantity: 0 })
                .expect(400);
        });
    });

    describe('/client (PUT)', () => {
        it('updates client basic fields and relations', async () => {
            const refs = await seedRefs();
            // Seed goal to relate later (no HTTP endpoint for goals)
            const goal = await clientGoalRepo.save(clientGoalRepo.create({ name: 'Lose weight' }));

            const id = await createClientFixture({
                name: 'Old',
                lastName: 'Name',
                birthDate: '1999-09-09' as any,
            });

            const updatedRes = await request(app.getHttpServer())
                .put(`/client/${id}`)
                .send({
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
                })
                .expect(200);

            const updated = updatedRes.body;
            expect(updated.name).toBe('New');
            expect(updated.clientGoal).toMatchObject({ id: goal.id });
            expect(Array.isArray(updated.observations)).toBe(true);
        });

        it('returns 404 when client does not exist', async () => {
            const refs = await seedRefs();
            // Build a valid DTO so the error comes from missing client, not validation
            const validDto: any = {
                name: 'X',
                lastName: 'Y',
                genderId: refs.genderId,
                bloodTypeId: refs.bloodTypeId,
                documentNumber: 'U404',
                email: 'x@y.com',
                birthDate: '2000-01-01',
            };
            await request(app.getHttpServer())
                .put('/client/999')
                .send(validDto)
                .expect(404);
        });

        it('returns 400 when DTO is invalid', async () => {
            // Missing required fields
            await request(app.getHttpServer())
                .put('/client/1')
                .send({ name: 'OnlyName' })
                .expect(400);
        });
    });

    describe('/client (DELETE)', () => {
        it('soft deletes a client and prevents future updates', async () => {
            const id = await createClientFixture({
                name: 'Del',
                lastName: 'Me',
                birthDate: '1980-05-05' as any,
            });

            const delRes = await request(app.getHttpServer())
                .delete(`/client/${id}`)
                .expect(200);
            expect(delRes.body).toEqual({ message: `Client with ID ${id} deleted successfully` });

            // Attempting to update should now fail with 404
            const refs = await seedRefs();
            await request(app.getHttpServer())
                .put(`/client/${id}`)
                .send({
                    name: 'ShouldFail',
                    lastName: 'X',
                    genderId: refs.genderId,
                    bloodTypeId: refs.bloodTypeId,
                    documentNumber: 'DEL1',
                    email: 'del@e.com',
                    birthDate: '1980-05-05',
                })
                .expect(404);
        });
    });
});