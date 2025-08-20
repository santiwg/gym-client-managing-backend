import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Client } from '../../clients/client/client.entity';

@Entity('genders')
export class Gender extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	name: string;

	@OneToMany(() => Client, client => client.gender)
	clients: Client[];
}
