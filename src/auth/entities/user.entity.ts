import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({unique:true})
  @Column()
  email: string;

  @Column()
  password: string;
  
  //mas adelante tendria que sacarle lo de null
  @ManyToOne(() => Role, role => role.users,{ eager: true ,nullable:true})
  role: Role;
}
