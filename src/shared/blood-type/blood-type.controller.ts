import { Body, Controller, Get, Post } from '@nestjs/common';
import { BloodTypeService } from './blood-type.service';
import { BloodType } from './blood-type.entity';
import { BloodTypeDto } from './dtos/blood-type.dto';

@Controller('blood-type')
export class BloodTypeController {
    constructor(private readonly bloodTypeService: BloodTypeService) {}


    @Get()
    async findAll(): Promise<BloodType[]> {
        return this.bloodTypeService.findAll();
    }

    @Post()
    async create(@Body() bloodTypeData: BloodTypeDto): Promise<BloodType> {
        return this.bloodTypeService.create(bloodTypeData);
    }
}
