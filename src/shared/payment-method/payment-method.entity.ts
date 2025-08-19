import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Payment } from "../../purchases/payment/payment.entity";
import { PaymentCollection } from "../../sales/payment-collection/payment-collection.entity";

@Entity('payment-methods')
export class PaymentMethod extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({ nullable: true ,type: 'text'})
    description: string | null;

    @OneToMany(() => Payment, payment => payment.paymentMethod)
    payments: Payment[];

    @OneToMany(() => PaymentCollection, paymentCollection => paymentCollection.paymentMethod)
    paymentCollections: PaymentCollection[];
}
