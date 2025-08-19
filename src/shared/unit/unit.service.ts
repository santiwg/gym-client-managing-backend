import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './unit.entity';
import { NewUnitDto } from './dtos/newUnit.dto';

@Injectable()
export class UnitService {
    constructor(@InjectRepository(Unit) private repository: Repository<Unit>) { }

    findAll(): Promise<Unit[]> {
        return this.repository.find();
    }
    async findByScope(scope: string): Promise<Unit[]> {
        const units = await this.repository.find({ where: { scope } });
        if (units.length === 0) {
        throw new NotFoundException(`No units found for scope '${scope}'`);
        }
        return units;
    }

    async findById(id: number): Promise<Unit> {
        const unit = await this.repository.findOneBy({ id });
        if (!unit) {
            throw new NotFoundException(`Unit with id ${id} not found`);
        }
        return unit;
    }
    async create(unit: NewUnitDto): Promise<Unit> {
        const newUnit = this.repository.create(unit);
        return this.repository.save(newUnit);
    }
}
