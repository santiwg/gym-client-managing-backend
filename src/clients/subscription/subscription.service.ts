import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ClientService } from '../client/client.service';
import { Subscription } from './subscription.entity';
import { SubscriptionDto } from './dtos/subscription.dto';
import { StateService } from 'src/shared/state/state.service';
import { MembershipService } from 'src/membership/membership/membership.service';
import { FeeCollectionService } from '../fee-collection/fee-collection.service';

@Injectable()
export class SubscriptionService {
    constructor(private readonly subscriptionRepository: Repository<Subscription>,
        private readonly clientService: ClientService,
        private readonly membershipService: MembershipService,
        private readonly stateService: StateService,
        private readonly feeCollectionService: FeeCollectionService
    ) {}
    async getClientCurrentSubscription(clientDocumentNumber?: string,clientId?: number): Promise<Subscription | null> {
            if (!clientId && !clientDocumentNumber) return null;
            let client;
            if (clientId){
                client = await this.clientService.findById(clientId);
            }else if (clientDocumentNumber) {
                client = await this.clientService.findByDocumentNumber(clientDocumentNumber);
            }
            const subscriptions = client.subscriptions;
            if (!subscriptions || subscriptions.length === 0) throw new NotFoundException(`Subscription for client with id ${clientId} not found`);
            subscriptions.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
            // La más nueva estará en la posición 0
            const currentSubscription = subscriptions[0];
            //antes de devolverla valido el estado
            this.validateUpToDatePayment(currentSubscription);
            return currentSubscription;
    }
    async findById(id: number): Promise<Subscription> {
        const subscription = await this.subscriptionRepository.findOne({ where: { id }, relations: ['client', 'membership', 'state'] });
        if (!subscription) throw new NotFoundException('Subscription not found');
        //Antes de devolverlo le actualizo el estado si es necesario
        this.validateUpToDatePayment(subscription)
        return subscription;
    }
    async getHistoricalUnitAmount(subscriptionId: number): Promise<number> {
        const subscription = await this.findById(subscriptionId);
        return subscription.membership.monthlyPrice; //esto podria hacerlo el service de membership para mejor acoplamiento
    }
    async create(dto: SubscriptionDto): Promise<Subscription> {
        const {clientId,membershipId, ...subscriptionData} = dto;
        const client = await this.clientService.findById(clientId);
        const membership = await this.membershipService.findById(membershipId);
        const state = await this.stateService.findActiveState();
        const subscription = this.subscriptionRepository.create({
            ...subscriptionData,
            client,
            membership,
            state
        });
        return this.subscriptionRepository.save(subscription);
    }
    async makeClientSubscriptionInactive(clientId: number): Promise<Subscription> {
        const subscription = await this.getClientCurrentSubscription(undefined,clientId);
        if (!subscription) {
            throw new NotFoundException(`Subscription for client with id ${clientId} not found`);
        }
        subscription.state = await this.stateService.findInactiveState();
        return this.subscriptionRepository.save(subscription);
    }
    async makeSubscriptionInactive(subscriptionId: number): Promise<Subscription> {
        const subscription = await this.findById(subscriptionId);
        subscription.state = await this.stateService.findInactiveState();
        return this.subscriptionRepository.save(subscription);
    }

    async makeSubscriptionActive(subscriptionId: number): Promise<Subscription> {
        const subscription = await this.findById(subscriptionId);
        subscription.state = await this.stateService.findActiveState();
        return this.subscriptionRepository.save(subscription);
    }

    async makeSubscriptionSuspended(subscriptionId: number): Promise<Subscription> {
        const subscription = await this.findById(subscriptionId);
        subscription.state = await this.stateService.findSuspendedState();
        return this.subscriptionRepository.save(subscription);
    }
    async validateUpToDatePayment(subscription: Subscription) {
        if (!await this.feeCollectionService.validateUpToDatePayment(subscription.id)) {
            await this.makeSubscriptionSuspended(subscription.id);
        }
    }
    isActive(subscription: Subscription): boolean {
        return this.stateService.isActive(subscription.state);
    }
    async getAttendanceLimit(subscriptionId: number): Promise<number> {
        const subscription = await this.findById(subscriptionId);
        return subscription.membership.weeklyAttendanceLimit;
    }
}
