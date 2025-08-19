import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UnitService } from './unit.service';
import { Unit } from './unit.entity';
import { NewUnitDto } from './dtos/newUnit.dto';

@Controller('units')
export class UnitController {
    constructor(private readonly unitService: UnitService) {}

   @Get()
   async findAll(): Promise<Unit[]>  {
       return await this.unitService.findAll();
   }
   
   @Post()
   async create(@Body() newUnit: NewUnitDto): Promise<Unit>  {
        return await this.unitService.create(newUnit);
    }
    
    @Get('find-by-scope/:scope')
    async findByScope(@Param('scope') scope: string): Promise<Unit[]> {
        return await this.unitService.findByScope(scope);
    }
}
