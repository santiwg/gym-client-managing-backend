import { BaseEntity, Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { State } from '../../shared/state/state.entity';
import { FeeCollection } from '../fee-collection/fee-collection.entity';
import { Membership } from '../../membership/membership/membership.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Client } from "../client/client.entity";

@Entity('suscriptions')
export class SuscriptionEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'date' ,default: () => 'CURRENT_DATE'})
	startDate: Date;

	@ManyToOne(() => State) //no tiene relación bilateral
	state: State;

	@OneToMany(() => FeeCollection, feeCollection => feeCollection.suscription)
	feeCollections: FeeCollection[];

	@ManyToOne(() => Membership, membership => membership.suscriptions)
	membership: Membership;

	@OneToMany(() => Attendance, attendance => attendance.suscription)
	attendances: Attendance[];

	@ManyToOne(() => Client, client => client.suscriptions)
	client: Client;
}
