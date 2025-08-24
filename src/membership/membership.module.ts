import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { membership_module_entities } from '../entities';
import { MembershipController } from './membership/membership.controller';
import { MembershipService } from './membership/membership.service';

@Module({
  imports: [TypeOrmModule.forFeature(membership_module_entities)],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService]
})
export class MembershipModule {}
