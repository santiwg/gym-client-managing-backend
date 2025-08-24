import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { ClientDto } from './dtos/client.dto';
import { ClientGoalService } from '../client-goal/client-goal.service';
import { BloodTypeService } from 'src/shared/blood-type/blood-type.service';
import { GenderService } from 'src/shared/gender/gender.service';
import { ClientObservationDto } from '../client-observation/dtos/client-observation.dto';
import { ClientObservation } from '../client-observation/observation.entity';
import { PaginatedResponseDto } from 'src/shared/pagination/dtos/paginated-response.dto';
import { PaginationService } from 'src/shared/pagination/pagination.service';
import { PaginationDto } from 'src/shared/pagination/dtos/pagination.dto';
import { Subscription } from 'rxjs';

@Injectable()
export class ClientService {
	constructor(
		@InjectRepository(Client)
		private readonly clientRepository: Repository<Client>,
		private readonly clientObservationRepository: Repository<ClientObservation>,
		private readonly clientGoalService: ClientGoalService,
		private readonly genderService: GenderService,
		private readonly bloodTypeService: BloodTypeService,
		private readonly paginationService: PaginationService,
	) {}

	async findAll(): Promise<Client[]> {
		return this.clientRepository.find();
	}
	async findAllPaginated(pagination:PaginationDto):Promise<PaginatedResponseDto<Client>> {
		/* 
		const options = this.paginationService.getPaginationOptions(pagination, {
            order: { name: 'ASC' } // Ordena por nombre de forma ascendente (A-Z)
        });

        const [data, total] = await this.repository.findAndCount(options);

        const productsWithCosts: ProductWithCosts[] = [];

        for (const product of data) {
            const productWithCosts = await this.convertToProductWithCosts(product);
            productsWithCosts.push(productWithCosts);
        }

        return this.paginationService.createPaginatedResponse(productsWithCosts, total, pagination);
		*/ 
		const options = this.paginationService.getPaginationOptions(pagination, {
            order: { name: 'ASC' } // Ordena por nombre de forma ascendente (A-Z)
        })
		const [data, total] = await this.clientRepository.findAndCount(options);
		return this.paginationService.createPaginatedResponse(data, total, pagination);
	}
	async findById(id: number): Promise<Client> {
		const client = await this.clientRepository.findOne({ where: { id } });
		if (!client) {
			throw new NotFoundException('Client not found');
		}
		return client;
	}
	async findByDocumentNumber(documentNumber: string): Promise<Client> {
		const client = await this.clientRepository.findOne({
			where: { documentNumber },
			relations: [
				'subscriptions',
				'observations',
				'clientGoal',
				'gender',
				'bloodType'
			]
		});
		if (!client) {
			throw new NotFoundException('Client not found');
		}
		return client;
	}

	async create(dto: ClientDto): Promise<Client> {
		//VER COMO HACEMOS LO DE CLIENTOBSERVATION
		const {genderId, clientGoalId,bloodTypeId,clientObservations, ...data}=dto;
		const gender=await this.genderService.findById(genderId)
		const observations=this.createClientObservations(clientObservations||[])
		const clientGoal=clientGoalId? await this.clientGoalService.findById(clientGoalId):undefined
		const bloodType=await this.bloodTypeService.findById(bloodTypeId);
		const client=this.clientRepository.create({
			...data,
			gender,
			clientGoal,
			observations,
			bloodType
		});
		return this.clientRepository.save(client);
	}
	createClientObservations( observations: ClientObservationDto[]): Partial<ClientObservation>[] {
		const partialObservations: Partial<ClientObservation>[] = observations.map(obs => ({
			...obs,
			//no agregue id ni client porque se asignarán automáticamente
		}));
		return partialObservations;
	}
	
	async delete(id: number): Promise<{ message: string; }> {
        const client = await this.findById(id);
        await this.clientRepository.softRemove(client);
        return { message: `Client with ID ${id} deleted successfully` };
    }
	async update(id: number, client: ClientDto): Promise<Client> {
        // 1. Cargar cliente existente
        const existingClient = await this.findById(id);

        
        // 2. Procesar datos de actualización básicos
        const {genderId, clientGoalId,bloodTypeId,clientObservations, ...data}=client;
		const gender=await this.genderService.findById(genderId)
		const clientGoal=clientGoalId? await this.clientGoalService.findById(clientGoalId):undefined
		const bloodType=await this.bloodTypeService.findById(bloodTypeId);

        // 3. Actualizar propiedades básicas
        Object.assign(existingClient, {
            ...data,
            gender,
			clientGoal,
			bloodType
        });

        // 4. Actualizar recipeItems de forma eficiente
		if (clientObservations && clientObservations.length > 0) {
			await this.updateClientObservationsEfficiently(existingClient, clientObservations);
		}else{
			existingClient.observations = [];
		}
		// 5. Guardar cambios

        return await this.clientRepository.save(existingClient);
    }
	private async updateClientObservationsEfficiently(client: Client, newObservations: ClientObservationDto[]): Promise<void> {
        // Crear mapas para búsqueda rápida
        const newObservationsMap = new Map<string, ClientObservationDto>();
        newObservations.forEach(obs => {
            newObservationsMap.set(obs.summary, obs);
        });

        const existingObservationsMap = new Map<string, ClientObservation>();
        client.observations.forEach(obs => {
            existingObservationsMap.set(obs.summary, obs);
        });

        // 1. Identificar items a eliminar y eliminarlos físicamente
        const itemsToDelete = client.observations.filter(obs =>
            !newObservationsMap.has(obs.summary)
        );

        if (itemsToDelete.length > 0) {
            await this.clientObservationRepository.remove(itemsToDelete);
        }

        // 2. Actualizar items existentes que se mantienen
        const updatedItems: ClientObservation[] = [];

        for (const existingItem of client.observations) {
            const newItemData = newObservationsMap.get(existingItem.summary);

            if (newItemData) {
                // Si ya existe, actualizar comentario del item
                existingItem.comment = newItemData.comment||null;
				existingItem.date = newItemData.date||new Date();
                updatedItems.push(existingItem);
            }
        }

        // 3. Crear nuevos items
        for (const newItem of newObservations) {
            if (!existingObservationsMap.has(newItem.summary)) {
                // Es un nuevo ingrediente, crear RecipeItem
                const items = this.clientObservationRepository.create({
                    summary: newItem.summary,
                    comment: newItem.comment || null,
                    date: newItem.date || new Date()
                });
                updatedItems.push(items);
            }
        }

        // 4. Actualizar la colección
        client.observations = updatedItems;
    }

}
