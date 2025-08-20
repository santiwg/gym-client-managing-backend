import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientDto } from './dtos/client.dto';
import { Client } from './client.entity';

@Controller('client')
export class ClientController {
	constructor(private readonly clientService: ClientService) {}

	@Get()
	async findAll(): Promise<Client[]> {
		return this.clientService.findAll();
	}

	@Post()
	async create(@Body() dto: ClientDto): Promise<Client> {
		return this.clientService.create(dto);
	}
}
