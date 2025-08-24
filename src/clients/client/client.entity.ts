import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, OneToOne, JoinColumn, DeleteDateColumn } from "typeorm";
import { Gender } from '../../shared/gender/gender.entity';
import { BloodType } from '../../shared/blood-type/blood-type.entity';
import { Subscription } from '../subscription/subscription.entity';
import { ClientObservation } from '../client-observation/observation.entity';
import { ClientGoal } from '../client-goal/client-goal.entity';
import { Exclude } from "class-transformer";

@Entity('clients')
export class Client extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	lastName: string;

	@ManyToOne(() => Gender, gender => gender.clients)
	gender: Gender;

	@ManyToOne(() => BloodType, bloodType => bloodType.clients)
	bloodType: BloodType;

	@Column({ unique: true })
	documentNumber: string;

	@Column({ unique: true })
	email: string;

	@Column({ nullable: true })
	phoneNumber: string;

    //podría sacarse porque ya tenemos la fecha en la suscripción
	@Column({ type: 'date', default: () => 'CURRENT_DATE' })
	registrationDate: Date;

	@OneToMany(() => Subscription, subscription => subscription.client,{cascade:true})
	subscriptions: Subscription[];

	@OneToMany(() => ClientObservation, observation => observation.client,{cascade:true})
	observations: ClientObservation[];

	@ManyToOne(() => ClientGoal, clientGoal => clientGoal.clients,{nullable:true})
	clientGoal: ClientGoal;
	
	@Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
