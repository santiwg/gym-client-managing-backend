import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
// import { Check } from "../check/check.entity";
// import { PaymentCollection } from "../../sales/payment-collection/payment-collection.entity";
// import { Supplier } from "../../purchases/supplier/supplier.entity";

@Entity('states')
export class State extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    scope: string;

    @Column()
    name: string;

    // @OneToMany(() => Check, check => check.state)
    // checks: Check[];
}
