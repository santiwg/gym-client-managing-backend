import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { clients_module_entities } from '../entities';
import { ClientController } from './client/client.controller';
import { ClientService } from './client/client.service';
import { SubscriptionService } from './subscription/subscription.service';
import { FeeCollectionService } from './fee-collection/fee-collection.service';
import { AttendanceService } from './attendance/attendance.service';

@Module({
  imports: [TypeOrmModule.forFeature(clients_module_entities)],
  controllers: [ClientController],
  providers: [ClientService, SubscriptionService, FeeCollectionService, AttendanceService]
})
export class ClientsModule {}
