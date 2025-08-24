import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodType } from './blood-type.entity';
import { NotFoundError } from 'rxjs';

@Injectable()
export class BloodTypeService {
    constructor (
        @InjectRepository(BloodType)
        private readonly bloodTypeRepository: Repository<BloodType>
    ) {}
    
    async findAll(): Promise<BloodType[]> {
        return this.bloodTypeRepository.find();
    }
    async findById(id: number): Promise<BloodType> {
        const bloodType = await this.bloodTypeRepository.findOne({ where: { id } });
        if (!bloodType) throw new NotFoundException(`Blood type with id ${id} not found`);
        return bloodType;
    }
    async create(data: Partial<BloodType>): Promise<BloodType> {
        const bloodType = this.bloodTypeRepository.create(data);
        return this.bloodTypeRepository.save(bloodType);
    }

}
