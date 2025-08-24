import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { all_entities } from './entities';
import { ClientsModule } from './clients/clients.module';
import { MembershipModule } from './membership/membership.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';

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
        url: configService.get<string>('DATABASE_URL'),
        entities: all_entities,
        synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true',
      }),
      inject: [ConfigService],
    }),
    SharedModule,
    ClientsModule,
    MembershipModule,
    AuthModule,
    CommonModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
