import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Cargar variables de entorno para migraciones
dotenv.config({ path: '.env.db' });

// Configuración de DataSource para migraciones TypeORM CLI
const AppDataSource = new DataSource({
  // Tipo de base de datos (postgres, mysql, sqlite, etc.)
  type: 'postgres',
  
  // URL completa de conexión a la base de datos
  url: process.env.DATABASE_URL,
  
  // Rutas donde TypeORM buscará las entidades para comparar con la BD
  entities: ['src/**/*.entity.{ts,js}'],
  
  // Directorio donde se guardarán los archivos de migración generados
  migrations: ['src/migrations/*.{ts,js}'],
  
  // Nunca sincronizar automáticamente en migraciones (evita pérdida de datos)
  synchronize: false,
  
  // Logging para debug de migraciones (opcional)
  logging: true,
});

export default AppDataSource;
