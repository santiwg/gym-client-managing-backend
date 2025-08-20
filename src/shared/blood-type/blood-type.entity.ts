import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Client } from '../../clients/client/client.entity';

@Entity('blood-types')
export class BloodType extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	name: string;

	@OneToMany(() => Client, client => client.bloodType)
	clients: Client[];
}
