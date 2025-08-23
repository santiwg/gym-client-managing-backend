import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Gender } from './gender.entity';

@Injectable()
export class GenderService {
	constructor (private readonly genderRepository: Repository<Gender>) {}
	async findAll(): Promise<Gender[]> {
		return this.genderRepository.find();
	}
	async findById(id: number): Promise<Gender> {
		const gender = await this.genderRepository.findOne({ where: { id } });
		if (!gender) throw new NotFoundException(`Gender with id ${id} not found`);
		return gender;
	}
	async create(data: Partial<Gender>): Promise<Gender> {
		const gender = this.genderRepository.create(data);
		return this.genderRepository.save(gender);
	}
}
