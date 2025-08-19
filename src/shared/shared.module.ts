import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateController } from './state/state.controller';
import { StateService } from './state/state.service';
import { PaymentMethodController } from './payment-method/payment-method.controller';
import { PaymentMethodService } from './payment-method/payment-method.service';
import { UnitController } from './unit/unit.controller';
import { UnitService } from './unit/unit.service';
import { PaginationService } from './pagination/pagination.service';
import { shared_module_entities } from '../entities';
import { GenderController } from './gender.controller';
import { GenderService } from './gender.service';
import { BloodTypeController } from './blood-type.controller';
import { BloodTypeService } from './blood-type.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(shared_module_entities)
  ],
  controllers: [StateController, PaymentMethodController, UnitController, GenderController, BloodTypeController],
  providers: [StateService, PaymentMethodService, UnitService, PaginationService, GenderService, BloodTypeService],
  exports: [UnitService, StateService, PaymentMethodService, PaginationService]
})
export class SharedModule {}
