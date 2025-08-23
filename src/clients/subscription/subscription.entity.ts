import { BaseEntity, Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { State } from '../../shared/state/state.entity';
import { FeeCollection } from '../fee-collection/fee-collection.entity';
import { Membership } from '../../membership/membership/membership.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Client } from "../client/client.entity";
import { Exclude } from "class-transformer";

@Entity('subscriptions')
export class SubscriptionEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'date' ,default: () => 'CURRENT_DATE'})
	startDate: Date;

	@ManyToOne(() => State) //no tiene relación bilateral
	state: State;

	@OneToMany(() => FeeCollection, feeCollection => feeCollection.subscription)
	feeCollections: FeeCollection[];

	@ManyToOne(() => Membership, membership => membership.subscriptions)
	membership: Membership;

	@OneToMany(() => Attendance, attendance => attendance.subscription)
	attendances: Attendance[];

	@ManyToOne(() => Client, client => client.subscriptions)
	client: Client;

	@Exclude()
	@DeleteDateColumn()
	deletedAt?: Date;
}
