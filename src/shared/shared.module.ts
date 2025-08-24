import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateController } from './state/state.controller';
import { StateService } from './state/state.service';
import { PaginationService } from './pagination/pagination.service';
import { shared_module_entities } from '../entities';
import { GenderController } from './gender/gender.controller';
import { GenderService } from './gender/gender.service';
import { BloodTypeController } from './blood-type/blood-type.controller';
import { BloodTypeService } from './blood-type/blood-type.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(shared_module_entities)
  ],
  controllers: [StateController, GenderController, BloodTypeController],
  providers: [StateService, GenderService, BloodTypeService, PaginationService],
  exports: [StateService, GenderService, BloodTypeService, PaginationService]
})
export class SharedModule {}
