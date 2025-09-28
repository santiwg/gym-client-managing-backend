import { Controller, Get, Post, Body, Query, Param, Delete, Put, NotFoundException } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientDto } from './dtos/client.dto';
import { Client } from './client.entity';
import { PaginationDto } from 'src/shared/pagination/dtos/pagination.dto';
import { PaginatedResponseDto } from 'src/shared/pagination/dtos/paginated-response.dto';
import { FeeCollectionService } from '../fee-collection/fee-collection.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { AttendanceService } from '../attendance/attendance.service';
import { Attendance } from '../attendance/attendance.entity';
import { AttendanceDto } from '../attendance/dtos/attendance.dto';
import { AttendanceRegistrationErrorResponse, AttendanceRegistrationSuccessResponse } from '../attendance/dtos/attendanceRegistrationResponse.interface';
import { FeeCollectionDto } from '../fee-collection/dtos/fee-collection.dto';
import { FeeCollection } from '../fee-collection/fee-collection.entity';
import { Subscription } from '../subscription/subscription.entity';
import { SubscriptionDto } from '../subscription/dtos/subscription.dto';

@Controller('client')
export class ClientController {
	constructor(private readonly clientService: ClientService,
		private readonly attendanceService: AttendanceService,
		private readonly subscriptionService: SubscriptionService,
		private readonly feeCollectionService: FeeCollectionService
	) { }

	@Get()
	async findAllPaginated(@Query() pagination: PaginationDto): Promise<PaginatedResponseDto<Client>> {
		return this.clientService.findAllPaginated(pagination);
	}


	@Post()
	async create(@Body() dto: ClientDto): Promise<Client> {
		return this.clientService.create(dto);
	}

	@Put(':id')
	async update(@Param('id') id: number, @Body() client: ClientDto): Promise<Client> {
		return await this.clientService.update(id, client);
	}

	@Delete(':id')
	async delete(@Param('id') id: number): Promise<{ message: string }> {
		return this.clientService.delete(id);
	}

	// En attendance y fee-collection no hay path param porque de momento la idea es que se hagan
	// introduciendo el dni (en el dto) y no el id, de manera que no sea necesario conocer el id del cliente

	@Post('attendance')
	async registerAttendance(@Body() dto: AttendanceDto): Promise<AttendanceRegistrationErrorResponse | AttendanceRegistrationSuccessResponse> {
		return this.attendanceService.create(dto);
	}
	@Post('fee-collection')
	async registerFeeCollection(@Body() dto: FeeCollectionDto): Promise<FeeCollection> {
		return this.feeCollectionService.create(dto);
	}
	@Get(':id/makeSubscriptionInActive')
	async makeSubscriptionInactive(@Param('id') id: number): Promise<{ message: string }> {
		return await this.subscriptionService.makeClientSubscriptionInactive(id);
	}
	@Get(':id/currentSubscription')
	async getCurrentSubscription(@Param('id') id: number): Promise<Subscription> {
		const currentSubscription = await this.subscriptionService.getClientCurrentSubscription(undefined, id);
		if (!currentSubscription) throw new NotFoundException(`Subscription for client with id ${id} not found`);
		return currentSubscription;
	}
	@Post(':id/subscription')
	async createSubscription(@Param('id') clientId: number, @Body() dto: SubscriptionDto): Promise<Subscription> {
		return this.subscriptionService.create(dto, clientId);
	}

}
