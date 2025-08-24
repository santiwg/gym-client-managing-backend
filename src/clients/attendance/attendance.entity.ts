import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Subscription } from '../subscription/subscription.entity';

@Entity('attendances')
export class Attendance extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp' , default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => Subscription, subscription => subscription.attendances)
    subscription: Subscription;
}
