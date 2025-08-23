import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipDto } from './dtos/membership.dto';

@Controller('membership')
export class MembershipController {
    constructor(private readonly membershipService: MembershipService) {}

    @Get()
    findAll() {
        return this.membershipService.findAll();
    }

    @Post()
    create(@Body() membershipDto: MembershipDto) {
        return this.membershipService.create(membershipDto);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() membershipDto: MembershipDto) {
        return this.membershipService.update(id, membershipDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<{ message: string }> {
        return await this.membershipService.delete(id);
    }

}


