import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClientGoalService } from './client-goal.service';
import { ClientGoalDto } from './dtos/client-goal.dto';
import { ClientGoal } from './client-goal.entity';

@Controller('client-goals')
export class ClientGoalController {
  constructor(private readonly clientGoalService: ClientGoalService) {}

  @Get()
  async findAll(): Promise<ClientGoal[]> {
    return this.clientGoalService.findAll();
  }

  @Post()
  async create(@Body() dto: ClientGoalDto): Promise<ClientGoal> {
    return this.clientGoalService.create(dto);
  }
}
