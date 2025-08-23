import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientGoal } from './client-goal.entity';
import { ClientGoalDto } from './dtos/client-goal.dto';

@Injectable()
export class ClientGoalService {
  constructor(
    @InjectRepository(ClientGoal)
    private readonly clientGoalRepository: Repository<ClientGoal>
  ) {}

  async findAll(): Promise<ClientGoal[]> {
    return this.clientGoalRepository.find();
  }

  async create(dto: ClientGoalDto): Promise<ClientGoal> {
    const clientGoal = this.clientGoalRepository.create(dto);
    return this.clientGoalRepository.save(clientGoal);
  }
  async findById(id: number): Promise<ClientGoal> {
    const clientGoal = await this.clientGoalRepository.findOne({where: {id}});
    if (!clientGoal) {
      throw new Error('ClientGoal not found');
    }
    return clientGoal;
  }
}