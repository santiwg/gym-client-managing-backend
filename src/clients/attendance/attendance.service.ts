import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { AttendanceDto } from './dtos/attendance.dto';

@Injectable()
export class AttendanceService {
	constructor(
		@InjectRepository(Attendance)
		private readonly attendanceRepository: Repository<Attendance>
	) {}

	async findAll(): Promise<Attendance[]> {
		return this.attendanceRepository.find();
	}

	async create(dto: AttendanceDto): Promise<Attendance> {
		const attendance = this.attendanceRepository.create(dto);
		return this.attendanceRepository.save(attendance);
	}
}
