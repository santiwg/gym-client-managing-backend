import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubscriptionService } from '../subscription/subscription.service';
import { Repository } from 'typeorm';
import { FeeCollection } from './fee-collection.entity';
import { FeeCollectionDto } from './dtos/fee-collection.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class FeeCollectionService {
    constructor(
        @Inject(forwardRef(() => SubscriptionService))
        private readonly subscriptionService: SubscriptionService,
        @InjectRepository(FeeCollection)
        private readonly feeCollectionRepository: Repository<FeeCollection>
    ) {}

    async validateUpToDatePayment(subscriptionId: number,): Promise<boolean> {
        const feeCollections: FeeCollection[] = await this.feeCollectionRepository.find({
            where: { subscription: { id: subscriptionId } }
        });
        if (!feeCollections || feeCollections.length === 0) return false;
        feeCollections.sort((a, b) => b.date.getTime() - a.date.getTime());
        // La más nueva estará en la posición 0
        const lastPayment = feeCollections[0];
        const now = new Date();
        const lastPaymentDate = new Date(lastPayment.date);
        //obtengo la fecha de vencimiento sumandole la cantidad de meses pagados a la fecha de pago
        const paymentDueDate = new Date(lastPaymentDate);
        paymentDueDate.setMonth(lastPaymentDate.getMonth() + lastPayment.paidMonths);
        return now < paymentDueDate;
    }
    async create(dto: FeeCollectionDto): Promise<FeeCollection> {
       const {clientDocumentNumber, ...feeCollectionData} = dto;
       const subscription = await this.subscriptionService.getClientCurrentSubscription(clientDocumentNumber);

       if (!subscription) throw new NotFoundException('No active subscription found');

       //asigno el monto historico, es decir el que tiene la membresia al momento del pago
       const historicalUnitAmount = await this.subscriptionService.getHistoricalUnitAmount(subscription.id);

       const feeCollection = this.feeCollectionRepository.create({
           subscription,
           historicalUnitAmount,
           ...feeCollectionData
       });
       const newFeeCollection = await this.feeCollectionRepository.save(feeCollection);

       //tras realizar el cobro la subscripcion queda activa
       this.subscriptionService.makeSubscriptionActive(subscription.id);

       //devuelvo el nuevo registro de cobro
       return newFeeCollection;
    }
}
