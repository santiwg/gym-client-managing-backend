import { BaseEntity, Entity, PrimaryGeneratedColumn, Index, Column, ManyToMany, JoinTable, OneToMany  } from "typeorm";
import { Permission } from "./permission.entity";
import { User } from "./user.entity";

@Entity('roles')
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({unique:true})
    @Column()
    name: string;

    @ManyToMany(() => Permission, permission => permission.roles,{ eager: true })
    @JoinTable()
    permissions: Permission[];

    @OneToMany(() => User, user => user.role)
    users: User[]
}