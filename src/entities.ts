//En este archivo declaro las entities de cada module para importarlas
//mas limpiamente en los modulos

// AUTH MODULE
import { User } from './auth/user/user.entity';
import { Role } from './auth/role/role.entity';
import { Permission } from './auth/permission/permission.entity';
export const auth_module_entities = [User, Role, Permission];

// CLIENTS MODULE
import { Client } from './clients/client/client.entity';
import { Attendance } from './clients/attendance/attendance.entity';
import { ClientObservation } from './clients/client-observation/observation.entity';
import { FeeCollection } from './clients/fee-collection/fee-collection.entity';
import { SuscriptionEntity } from './clients/suscription/suscription.entity';
export const clients_module_entities = [Client,Attendance, ClientObservation, FeeCollection, SuscriptionEntity];

// MEMBERSHIP MODULE
import { Membership } from './membership/membership/membership.entity';
export const membership_module_entities = [Membership];

// SHARED MODULE
import { BloodType } from './shared/blood-type/blood-type.entity';
import { Gender } from './shared/gender/gender.entity';
//import { PaymentMethod } from './shared/payment-method/payment-method.entity';
import { State } from './shared/state/state.entity';
//import { Unit } from './shared/unit/unit.entity';
export const shared_module_entities = [BloodType, Gender, State, ]; //for now we don't use payment-method nor unit

// ALL ENTITIES
export const all_entities = [
  ...auth_module_entities,
  ...clients_module_entities,
  ...membership_module_entities,
  ...shared_module_entities
];