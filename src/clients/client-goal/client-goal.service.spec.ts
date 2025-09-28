// ClientGoalService unit tests
//
// What to know:
// - We mock the TypeORM repository to cover CRUD flows deterministically.
// - Error paths: findById -> NotFound when null; create/save propagates DB errors.
import { Test } from '@nestjs/testing';
import { ClientGoalController } from './client-goal.controller';
import { ClientGoal } from './client-goal.entity';
import { ClientGoalService } from './client-goal.service';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ClientGoalDto } from './dtos/client-goal.dto';

import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ClientGoalService', () => {
    let clientGoalService: ClientGoalService;
    const clientGoalRepositoryMock = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn()
        // otros métodos si los usás
    };
    const goal1 = { id: 1, name: 'Goal1', description: 'Description1' } as ClientGoal
    const goal2 = { id: 2, name: 'Goal2' } as ClientGoal
    const result: ClientGoal[] = [goal1, goal2
        ,
    ];

    const newGoal = { name: 'Goal1', description: 'Description1' } as ClientGoalDto;
    beforeEach(async () => {



        Object.values(clientGoalRepositoryMock).forEach(fn => fn.mockReset && fn.mockReset());
        const moduleRef = await Test.createTestingModule({
            //controllers: [ClientGoalController],
            providers: [
                {
                    provide: getRepositoryToken(ClientGoal),
                    useValue: clientGoalRepositoryMock,
                },
                ClientGoalService
            ],
        }).compile();
        clientGoalService = moduleRef.get<ClientGoalService>(ClientGoalService);
    });

    describe('findAll', () => {
        it('should return an array of client goals when service returns client goals', async () => {
            clientGoalRepositoryMock.find.mockResolvedValue(result);
            expect(await clientGoalService.findAll()).toEqual(result);
            expect(clientGoalRepositoryMock.find).toHaveBeenCalled();
        });
        it('should return empty array when service returns none', async () => {
            clientGoalRepositoryMock.find.mockResolvedValue([]);
            expect(await clientGoalService.findAll()).toEqual([]);
            expect(clientGoalRepositoryMock.find).toHaveBeenCalled();
        });
        it('should throw when service throws', async () => {
            clientGoalRepositoryMock.find.mockImplementation(() => { throw new Error('DB error'); });
            await expect(clientGoalService.findAll()).rejects.toThrow('DB error');
            expect(clientGoalRepositoryMock.find).toHaveBeenCalled();
        });
    });
    describe('findById', () => {
        it('should return a client goal when service returns a client goal', async () => {
            clientGoalRepositoryMock.findOne.mockResolvedValue(goal1);
            expect(await clientGoalService.findById(1)).toEqual(goal1);
            expect(clientGoalRepositoryMock.findOne).toHaveBeenCalled();
        });
        it('should throw when service throws', async () => {
            clientGoalRepositoryMock.findOne.mockResolvedValue(null);
            await expect(clientGoalService.findById(1)).rejects.toThrow(NotFoundException);
            expect(clientGoalRepositoryMock.findOne).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should create a client goal when service creates a client goal', async () => {
            clientGoalRepositoryMock.create.mockReturnValue({ ...newGoal } as ClientGoal);
            clientGoalRepositoryMock.save.mockResolvedValue({ ...newGoal, id: 1 } as ClientGoal);
            expect(await clientGoalService.create(newGoal)).toEqual({ ...newGoal, id: 1 });
            expect(clientGoalRepositoryMock.create).toHaveBeenCalledWith(newGoal);
            expect(clientGoalRepositoryMock.save).toHaveBeenCalled();
        });
        it('should throw when service throws', async () => {
            clientGoalRepositoryMock.create.mockReturnValue({ ...newGoal } as ClientGoal);
            clientGoalRepositoryMock.save.mockImplementation(() => { throw new Error('DB error'); });
            await expect(clientGoalService.create(newGoal)).rejects.toThrow('DB error');
            expect(clientGoalRepositoryMock.create).toHaveBeenCalledWith(newGoal);
            expect(clientGoalRepositoryMock.save).toHaveBeenCalled();
        });
    });
});