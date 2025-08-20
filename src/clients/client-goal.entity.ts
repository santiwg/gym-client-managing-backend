import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Client } from "./client/client.entity";

@Entity('client-goals')
export class ClientGoal extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({type:'text', nullable:true})
    description: string | null;

    @OneToMany(() => Client, client => client.clientGoal)
    clients: Client[];
}
