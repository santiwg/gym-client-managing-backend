import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './attendance.entity';
import { AttendanceDto } from './dtos/attendance.dto';
import { AttendanceRegistrationErrorResponse, AttendanceRegistrationSuccessResponse } from './dtos/attendanceRegistrationResponse.interface';
import { SubscriptionService } from '../subscription/subscription.service';
import { Subscription } from '../subscription/subscription.entity';

@Injectable()
export class AttendanceService {
	constructor(
		@InjectRepository(Attendance)
		private readonly attendanceRepository: Repository<Attendance>,
		private readonly subscriptionService: SubscriptionService
	) {}


	async create(dto: AttendanceDto): Promise<AttendanceRegistrationSuccessResponse | AttendanceRegistrationErrorResponse> {
		const {clientDocumentNumber, ...data}=dto;
		const subscription=await this.subscriptionService.getClientCurrentSubscription(clientDocumentNumber,undefined);
		if (!subscription) {
			return { success: false, message: 'No active subscription found' };
		}
		if (!this.subscriptionService.isActive(subscription)) {
			return { success: false, message: 'Inactive subscription' };
		}
		if (await this.validateCurrentWeekAttendanceLimitIsExceeded(subscription)) {
			return { success: false, message: 'Attendance limit exceeded' };
		}
		const attendance = this.attendanceRepository.create({
			...data,
			subscription
		});
		await this.attendanceRepository.save(attendance);
		return { success: true};
	}
	async validateCurrentWeekAttendanceLimitIsExceeded(subscription: Subscription): Promise<boolean> {
		// Get all attendances for this subscription in the current week
		const attendances: Attendance[] = await this.attendanceRepository.find({
			where: {
				subscription,
				dateTime: Between(this.startOfWeek(), this.endOfWeek())
			}
		});
		// Return true if the attendance limit is exceeded
		const limit = await this.subscriptionService.getAttendanceLimit(subscription.id);
		return attendances.length >= limit;
	}
	/**
	 * Returns a Date object representing the start (Sunday, 00:00:00.000) of the current week.
	 * Example: If today is Wednesday, returns the previous Sunday at midnight.
	 */
	startOfWeek() {
		const date = new Date();
		date.setDate(date.getDate() - date.getDay()); //numero del dia del mes - numero del dia de la semana
		date.setHours(0, 0, 0, 0);
		return date;
	}

	/**
	 * Returns a Date object representing the end (Saturday, 23:59:59.999) of the current week.
	 * Example: If today is Wednesday, returns the next Saturday at 23:59:59.999.
	 */
	endOfWeek() {
		const date = new Date();
		date.setDate(date.getDate() - date.getDay() + 6); //numero del dia del mes - numero del dia de la semana + 6
		date.setHours(23, 59, 59, 999);
		return date;
	}
}
