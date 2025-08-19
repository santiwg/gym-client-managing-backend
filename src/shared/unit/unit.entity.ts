import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('units')
export class Unit extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true ,type:'text'})
    description: string | null;

    @Column()
    scope: string;
}
