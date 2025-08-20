import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SuscriptionEntity } from '../suscription/suscription.entity';

@Entity('attendances')
export class Attendance extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp' , default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => SuscriptionEntity, suscription => suscription.attendances)
    suscription: SuscriptionEntity;
}
