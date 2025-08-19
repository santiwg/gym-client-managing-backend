import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { all_entities } from './entities';
import { ClientsModule } from './clients/clients.module';
import { MembershipModule } from './membership/membership.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.db',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
    type: configService.get<string>('DATABASE_TYPE') as 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: Number(configService.get<string>('DB_PORT') ?? 5432),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: all_entities, //LLENAR ESE ARRAY
    synchronize: true,
      }),
      inject: [ConfigService],
    }),
    SharedModule,
    ClientsModule,
    MembershipModule,
    UsersModule,
    CommonModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
