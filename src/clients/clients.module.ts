import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { clients_module_entities } from '../entities';
import { ClientController } from './client/client.controller';
import { ClientService } from './client/client.service';
import { SubscriptionService } from './subscription/subscription.service';
import { FeeCollectionService } from './fee-collection/fee-collection.service';
import { AttendanceService } from './attendance/attendance.service';
import { ClientGoal } from './client-goal/client-goal.entity';
import { ClientGoalService } from './client-goal/client-goal.service';
import { ClientGoalController } from './client-goal/client-goal.controller';
import { SharedModule } from 'src/shared/shared.module';
import { Membership } from 'src/membership/membership/membership.entity';
import { MembershipModule } from 'src/membership/membership.module';

@Module({
  imports: [TypeOrmModule.forFeature(clients_module_entities), SharedModule, MembershipModule],
  controllers: [ClientController, ClientGoalController],
  providers: [ClientService, SubscriptionService, FeeCollectionService, AttendanceService, ClientGoalService]
})
export class ClientsModule { }
