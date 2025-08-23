import { BaseEntity, Column, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Client } from '../client/client.entity';
import { Exclude } from "class-transformer";

@Entity('client-observations')
export class ClientObservation extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text' })
	summary: string;

	@Column({ type: 'text', nullable: true })
	comment: string | null;

	@Column({ type: 'date', default: () => 'CURRENT_DATE' })
	date: Date;

	@ManyToOne(() => Client, client => client.observations)
	client: Client;

	@Exclude()
	@DeleteDateColumn()
	deletedAt?: Date;
}
