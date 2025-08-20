import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from '../../shared/transformers/decimal.transformer';
import { SuscriptionEntity } from '../../clients/suscription/suscription.entity';

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

	@OneToMany(() => SuscriptionEntity, suscription => suscription.membership)
	suscriptions: SuscriptionEntity[];
}
