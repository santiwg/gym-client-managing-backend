import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from '../../shared/transformers/decimal.transformer';
import { Subscription } from '../subscription/subscription.entity';

@Entity('fee-collections')
export class FeeCollection extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'date' ,default: () => 'CURRENT_DATE'})
	date: Date;

	@Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
	historicalUnitAmount: number;

	@Column({ type: 'int' })
	paidMonths: number; //amount of months paid

	@ManyToOne(() => Subscription, subscription => subscription.feeCollections)
	subscription: Subscription;
}
