import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import 'dotenv/config';
import { Client as PgClient } from 'pg';
import * as request from 'supertest';

import { AuthModule } from './auth.module';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { hashSync } from 'bcrypt';

describe('AuthModule security e2e', () => {
  /**
   * Pruebas E2E con foco en inyección (SQL/XSS) para endpoints de auth.
   * - Levantamos una app Nest real y hacemos HTTP con supertest.
   * - Usamos Postgres con un schema aislado por worker: auth_e2e_${JEST_WORKER_ID}.
   * - Limpiamos tablas con TRUNCATE "schema"."table" RESTART IDENTITY CASCADE.
   * - Sembramos un usuario válido para contrastar contra payloads maliciosos.
   */
  let moduleRef: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;
  let dbSchema: string;

  // repos para preparar/verificar estado
  let userRepo: Repository<User>;
  let roleRepo: Repository<Role>;
  let permRepo: Repository<Permission>;

  // Aumenta el timeout de Jest para estas pruebas E2E con DB real
  jest.setTimeout(30000);

  // Crea el schema de Postgres si no existe (idempotente)
  // Evita colisiones entre suites/threads al usar cada test su propio schema
  const ensureSchema = async (schema: string) => {
    const url = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5433/gym_test';
    const client = new PgClient({ connectionString: url });
    await client.connect();
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
    await client.end();
  };

  beforeAll(async () => {
    dbSchema = `auth_e2e_${process.env.JEST_WORKER_ID || '1'}`;
    await ensureSchema(dbSchema);

    // Módulo de testing: TypeORM + AuthModule real
    moduleRef = await Test.createTestingModule({
      imports: [
        // Conexión TypeORM enfocada a este schema aislado
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5433/gym_test',
          schema: dbSchema,            // aísla este suite en su propio schema
          ssl: false,
          autoLoadEntities: true,      // registra entidades automáticamente
          synchronize: true,           // crea el esquema a partir de entidades
          dropSchema: true,            // limpia al iniciar la conexión
          logging: false,
          retryAttempts: 3,            // reintentos por si la DB tarda
          retryDelay: 800,
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // pipe para validar DTOs y transformar tipos (400 para requests inválidas)
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    dataSource = moduleRef.get(DataSource);

    userRepo = moduleRef.get(getRepositoryToken(User));
    roleRepo = moduleRef.get(getRepositoryToken(Role));
    permRepo = moduleRef.get(getRepositoryToken(Permission));
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      try {
        // elimina el schema aislado de este suite
        await dataSource.query(`DROP SCHEMA IF EXISTS "${dbSchema}" CASCADE;`);
      } catch {}
      await dataSource.destroy();
    }
    await app.close();
    await moduleRef.close();
  });

  const clearDatabase = async () => {
    if ((dataSource.options as any).type === 'postgres') {
      // Construye lista "schema"."table" para TRUNCATE seguro con FK
      const tables = dataSource.entityMetadatas
        .map((m: any) => {
          const schema = m.schema || (typeof m.tablePath === 'string' && m.tablePath.includes('.') ? m.tablePath.split('.')[0] : undefined);
          const table = m.tableName || (typeof m.tablePath === 'string' ? m.tablePath.split('.').slice(-1)[0] : undefined);
          return schema ? `"${schema}"."${table}"` : `"${table}"`;
        })
        .join(', ');
      if (tables.length > 0) {
        // Vacía todas las tablas, reinicia IDs y respeta FKs
        await dataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
      }
      return;
    }
    // Fallback para otros drivers
    await userRepo.delete({});
    await roleRepo.delete({});
    await permRepo.delete({});
  };

  const seedUser = async (overrides: Partial<User> = {}) => {
    // Crea un usuario válido; password se guarda hasheada
    const base: Partial<User> = {
      email: 'safe@example.com',
      password: hashSync('secret', 10),
    };
    const entity = userRepo.create({ ...base, ...overrides } as any);
    return userRepo.save(entity);
  };

  beforeEach(async () => {
    // Estado limpio antes de cada prueba
    await clearDatabase();
  });

  describe('POST /users/login (inyección en email)', () => {
    it('rechaza "\' OR 1=1; --" con 400 (falla validación de email) y no altera la cantidad de usuarios', async () => {
      await seedUser();
      const before = await userRepo.count();

      await request(app.getHttpServer())
        .post('/users/login')
        .send({ email: `' OR 1=1; --`, password: 'x' })
        .expect(400); // ValidationPipe + @IsEmail rechaza formato

      const after = await userRepo.count();
      expect(after).toBe(before); // verifica que no se modificó el estado
      // Health check sin SQL crudo: repos siguen operativos
      await expect(userRepo.count()).resolves.toBeGreaterThanOrEqual(0);
    });

    it('rechaza UNION SELECT en email con 400 (email inválido) y el esquema sigue intacto', async () => {
      await seedUser({ email: 'admin@example.com' });
      const before = await userRepo.count();

      await request(app.getHttpServer())
        .post('/users/login')
        .send({ email: `admin@example.com' UNION SELECT * FROM users --`, password: 'irrelevant' })
        .expect(400); // formato de email deja de ser válido al añadir inyección

      const after = await userRepo.count();
      expect(after).toBe(before);
      // Comprobación mínima de integridad: podemos seguir listando usuarios
      const all = await userRepo.find();
      expect(Array.isArray(all)).toBe(true);
    });
  });

  describe('POST /users/register (payloads maliciosos como strings)', () => {
    it("rechaza payload con intento de inyección en email (400) y no persiste", async () => {
      const before = await userRepo.count();
      const email = `new@example.com'; DROP TABLE users; --`;

      await request(app.getHttpServer())
        .post('/users/register')
        .send({ email, password: "p4ss' OR '1'='1" })
        .expect(400); // email deja de cumplir @IsEmail

      const after = await userRepo.count();
      expect(after).toBe(before); // sin cambios
      const one = await userRepo.findOne({ where: { email } });
      expect(one).toBeNull(); // nada persistido
    });
  });

  describe('XSS non-reflection (respuestas HTTP no devuelven el input)', () => {
    it('login: 401 sin reflejar <script> en el body de error', async () => {
      const malicious = '<script>alert(1)</script>@mail.com';
      const res = await request(app.getHttpServer())
        .post('/users/login')
        .send({ email: malicious, password: 'wrong' })
        .expect(400); // email inválido provoca 400 antes de auth

      const payload = typeof res.text === 'string' && res.text.length ? res.text : JSON.stringify(res.body);
      expect(payload).not.toContain('<script>');
      expect(payload).not.toContain(malicious);
    });

    it('register inválido: 400 sin reflejar <script> en el body de error', async () => {
      const malicious = '<script>alert(2)</script>@mail.com';
      const res = await request(app.getHttpServer())
        .post('/users/register')
        // omitimos password para forzar 400 por ValidationPipe
        .send({ email: malicious })
        .expect(400);

      const payload = typeof res.text === 'string' && res.text.length ? res.text : JSON.stringify(res.body);
      expect(payload).not.toContain('<script>');
      expect(payload).not.toContain(malicious);
    });
  });

  // Verifica que no se persisten scripts maliciosos gracias a la validación (DTO + ValidationPipe)
  describe('XSS persistence (no guardar scripts en DB)', () => {
    it('register: 400 y no persiste cuando email contiene <script>', async () => {
      const before = await userRepo.count();
      const malicious = '<script>alert(3)</script>@mail.com';

      // RegisterDTO usa @IsEmail, por lo que el ValidationPipe debe rechazar este formato
      await request(app.getHttpServer())
        .post('/users/register')
        .send({ email: malicious, password: 'secret123' })
        .expect(400);

      const after = await userRepo.count();
      expect(after).toBe(before); // estado sin cambios

      const found = await userRepo.findOne({ where: { email: malicious } });
      expect(found).toBeNull(); // no se guardó el input malicioso
    });
  });
});
