import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Membership } from './membership.entity';
import { MembershipDto } from './dtos/membership.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class MembershipService {
    constructor(private readonly membershipRepository: Repository<Membership>) { }

    async findAll(): Promise<Membership[]> {
        return this.membershipRepository.find();
    }

    async create(membershipDto: MembershipDto): Promise<Membership> {
        const membership = this.membershipRepository.create(membershipDto);
        return this.membershipRepository.save(membership);
    }
    async findById(id: number): Promise<Membership> {
        const membership = await this.membershipRepository.findOne({ where: { id } });
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }
        return membership;
    }

    async update(id: number, membershipDto: MembershipDto): Promise<Membership> {
        const existingMembership = await this.findById(id);

        Object.assign(existingMembership, membershipDto);
        return await this.membershipRepository.save(existingMembership);
    }

    async delete(id: number): Promise<{ message: string; }> {
        const membership = await this.findById(id);
        await this.membershipRepository.softRemove(membership);
        return { message: `Membership with ID ${id} deleted successfully` };
    }
}
