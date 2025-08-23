import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { State } from './state.entity';

@Injectable()
export class StateService {
	constructor (private readonly stateRepository: Repository<State>) {}
	async findAll(): Promise<State[]> {
		return this.stateRepository.find();
	}
	async findById(id: number): Promise<State> {
		const state = await this.stateRepository.findOne({ where: { id } });
		if (!state) throw new NotFoundException(`State with id ${id} not found`);
		return state;
	}
	async findByName(name: string): Promise<State> {
		const state = await this.stateRepository.findOne({ where: { name } });
		if (!state) throw new NotFoundException(`State with name ${name} not found`);
		return state;
	}
	isActive(state: State): boolean {
		return state.name.toLowerCase() === 'active';
	}
	isSuspended(state: State): boolean {
		return state.name.toLowerCase() === 'suspended';
	}
	isInactive(state: State): boolean {
		return state.name.toLowerCase() === 'inactive';
	}
	async create(data: Partial<State>): Promise<State> {
		const state = this.stateRepository.create(data);
		return this.stateRepository.save(state);
	}
}
