import { BaseEntity, Entity, Index, ManyToMany, PrimaryGeneratedColumn, Column } from "typeorm";
import { Role } from "./role.entity";


@Entity('permissions')
export class Permission extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Index({unique:true})
    @Column()
    name: string;

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[]
}

