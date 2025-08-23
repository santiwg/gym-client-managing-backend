import { Body, Controller, Get, Post } from '@nestjs/common';
import { StateService } from './state.service';
import { State } from './state.entity';

@Controller('state')
export class StateController {
	constructor(private readonly stateService: StateService) {}

	@Get()
	async findAll(): Promise<State[]> {
		return this.stateService.findAll();
	}

	@Post()
	async create(@Body() stateData: Partial<State>): Promise<State> {
		return this.stateService.create(stateData);
	}
}
