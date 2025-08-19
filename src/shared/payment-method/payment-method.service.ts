import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './payment-method.entity';

@Injectable()
export class PaymentMethodService {
    constructor(@InjectRepository(PaymentMethod) private repository: Repository<PaymentMethod>) { }
}
