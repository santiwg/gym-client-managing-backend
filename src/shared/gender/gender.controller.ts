import { Body, Controller, Get, Post } from '@nestjs/common';
import { GenderService } from './gender.service';
import { Gender } from './gender.entity';
import { GenderDto } from './dtos/gender.dto';

@Controller('gender')
export class GenderController {
	constructor(private readonly genderService: GenderService) {}

	@Get()
	async findAll(): Promise<Gender[]> {
		return this.genderService.findAll();
	}

	@Post()
	async create(@Body() genderData: GenderDto): Promise<Gender> {
		return this.genderService.create(genderData);
	}
}
