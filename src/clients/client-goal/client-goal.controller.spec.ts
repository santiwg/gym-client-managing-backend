import { Test } from '@nestjs/testing';
import { ClientGoalController } from './client-goal.controller';
import { ClientGoal } from './client-goal.entity';
import { ClientGoalService } from './client-goal.service';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ClientGoalDto } from './dtos/client-goal.dto';

import { Repository } from 'typeorm';

describe('ClientGoalController', () => {
    let clientGoalController: ClientGoalController;
    let clientGoalService: ClientGoalService;
    //const clientGoalRepositoryMock = mock<Repository<ClientGoal>>();
    const result: ClientGoal[] = [
        { id: 1, name: 'Goal1', description: 'Description1' } as ClientGoal,
        { id: 2, name: 'Goal2' } as ClientGoal,
    ];
    const goal = { name: 'Goal1', description: 'Description1' } as ClientGoalDto;
    beforeEach(async () => {
        
        

        const moduleRef = await Test.createTestingModule({
            controllers: [ClientGoalController],
            providers: [
                {
                    provide: ClientGoalService,
                    useValue: {
                        findAll: jest.fn(),
                        create: jest.fn(),
                        // otros métodos si los usás
                    }
                }
            ],
        }).compile();

        clientGoalService = moduleRef.get(ClientGoalService);
        clientGoalController = moduleRef.get(ClientGoalController);
    });

    describe('findAll', () => {
        it('should return an array of client goals when service returns client goals', async () => {

            jest.spyOn(clientGoalService, 'findAll').mockImplementation(async () => result);

            expect(await clientGoalController.findAll()).toBe(result);
        });
        it('should return empty array when service returns none', async () => {
            jest.spyOn(clientGoalService, 'findAll').mockResolvedValue([] as any);
            expect(await clientGoalController.findAll()).toEqual([]);
        });

        it('should throw when service throws', async () => {
            jest.spyOn(clientGoalService, 'findAll').mockImplementation(() => {
                throw new Error('DB error');
            });
            await expect(clientGoalController.findAll()).rejects.toThrow('DB error');
        });
    });
    /*describe('findById', () => {
        it('should return a client goal when service returns a client goal', async () => {
            const goal = { id: 1, name: 'Goal1', description: 'Description1' } as ClientGoal;
            jest.spyOn(clientGoalService, 'findById').mockImplementation(async () => goal);
            expect(await clientGoalController.findById(1)).toBe(goal);
        });
        it('should throw when service throws', async () => {
            jest.spyOn(clientGoalService, 'findById').mockImplementation(() => {
                throw new NotFoundException('ClientGoal not found');
            });
            await expect(clientGoalController.findById(1)).rejects.toThrow('ClientGoal not found');
        });
    });*/
    describe('create', () => {
        it('should create a client goal when service creates a client goal', async () => {

            jest.spyOn(clientGoalService, 'create').mockImplementation(async () => { return { ...goal, id: 1 } as ClientGoal; });
            expect(await clientGoalController.create(goal)).toEqual({ ...goal, id: 1 });
        });
        it('should throw when service throws', async () => {
            jest.spyOn(clientGoalService, 'create').mockImplementation(() => {
                throw new Error('DB error');
            });
            await expect(clientGoalController.create(goal)).rejects.toThrow('DB error');
        });
    });
});