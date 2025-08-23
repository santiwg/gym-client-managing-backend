import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SubscriptionEntity } from '../subscription/subscription.entity';

@Entity('attendances')
export class Attendance extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp' , default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => SubscriptionEntity, subscription => subscription.attendances)
    subscription: SubscriptionEntity;
}
