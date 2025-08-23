import { Controller, Get, Post, Body, Query, Param, Delete, Put } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientDto } from './dtos/client.dto';
import { Client } from './client.entity';
import { PaginationDto } from 'src/shared/pagination/dtos/pagination.dto';
import { PaginatedResponseDto } from 'src/shared/pagination/dtos/paginated-response.dto';

@Controller('client')
export class ClientController {
	constructor(private readonly clientService: ClientService) {}

	@Get()
	async findAllPaginated(@Query() pagination: PaginationDto): Promise<PaginatedResponseDto<Client>> {
		return this.clientService.findAllPaginated(pagination);
	}


	@Post()
	async create(@Body() dto: ClientDto): Promise<Client> {
		
		return this.clientService.create(dto);
	}
	@Put(':id')
    async update(@Param('id') id: number, @Body() client: ClientDto): Promise<Client> {
        return await this.clientService.update(id, client);
    }
	
	@Delete(':id')
	async delete(@Param('id') id: number): Promise<{ message: string }> {
		return this.clientService.delete(id);
	}
	

}
