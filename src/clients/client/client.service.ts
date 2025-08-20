import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { ClientDto } from './dtos/client.dto';

@Injectable()
export class ClientService {
	constructor(
		@InjectRepository(Client)
		private readonly clientRepository: Repository<Client>
	) {}

	async findAll(): Promise<Client[]> {
		return this.clientRepository.find();
	}

	//async create(dto: ClientDto): Promise<Client> {
		/*hay que destructura los elementos
        const client = this.clientRepository.create(dto);
		return this.clientRepository.save(client);*/
	//}
}
