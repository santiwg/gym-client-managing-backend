import { BaseEntity, Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from '../../shared/transformers/decimal.transformer';
import { SubscriptionEntity } from '../../clients/subscription/subscription.entity';
import { Exclude } from "class-transformer";

@Entity('memberships')
export class Membership extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	name: string;

	@Column({ type: 'text', nullable: true })
	description: string | null;

	@Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
	monthlyPrice: number;

	@Column({ type: 'int' })
	weeklyAttendanceLimit: number;

	@OneToMany(() => SubscriptionEntity, subscription => subscription.membership)
	subscriptions: SubscriptionEntity[];

	@Exclude()
	@DeleteDateColumn()
	deletedAt?: Date;
}
