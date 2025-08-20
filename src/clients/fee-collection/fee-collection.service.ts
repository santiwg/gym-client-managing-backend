import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeCollection } from './fee-collection.entity';
import { FeeCollectionDto } from './dtos/fee-collection.dto';
import { SuscriptionEntity } from '../suscription/suscription.entity';

@Injectable()
export class FeeCollectionService {
	constructor(
		@InjectRepository(FeeCollection)
		private readonly feeCollectionRepository: Repository<FeeCollection>,
		@InjectRepository(SuscriptionEntity)
		private readonly suscriptionRepository: Repository<SuscriptionEntity>
	) {}

	async findAll(): Promise<FeeCollection[]> {
		return this.feeCollectionRepository.find({ relations: ['suscription'] });
	}

	async create(dto: FeeCollectionDto): Promise<FeeCollection> {
		const { suscriptionId, ...data } = dto;
		const suscription = await this.suscriptionRepository.findOneBy({ id: suscriptionId });
		if (!suscription) throw new Error('Suscription not found');
		const feeCollection = this.feeCollectionRepository.create({ ...data, suscription });
		return this.feeCollectionRepository.save(feeCollection);
	}
}
