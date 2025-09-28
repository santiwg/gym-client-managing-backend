// ClientGoalController unit tests
//
// What to know:
// - We mock ClientGoalService to isolate controller logic.
// - We cover both the happy paths and error propagation from the service.
import { Test } from '@nestjs/testing';
import { ClientGoalController } from './client-goal.controller';
import { ClientGoal } from './client-goal.entity';
import { ClientGoalService } from './client-goal.service';
import { ClientGoalDto } from './dtos/client-goal.dto';

describe('ClientGoalController', () => {
    let clientGoalController: ClientGoalController;
    let clientGoalService: ClientGoalService;
    const clientGoalServiceMock: {
        findAll: jest.Mock<any, any>;
        create: jest.Mock<any, any>;
    } = {
        findAll: jest.fn(),
        create: jest.fn(),
    };
    const result: ClientGoal[] = [
        { id: 1, name: 'Goal1', description: 'Description1' } as ClientGoal,
        { id: 2, name: 'Goal2' } as ClientGoal,
    ];
    const goal: ClientGoalDto = { name: 'Goal1', description: 'Description1' };

    beforeEach(async () => {
        Object.values(clientGoalServiceMock).forEach(fn => fn.mockReset && fn.mockReset());
        const moduleRef = await Test.createTestingModule({
            controllers: [ClientGoalController],
            providers: [
                {
                    provide: ClientGoalService,
                    useValue: clientGoalServiceMock
                }
            ],
        }).compile();
        clientGoalService = moduleRef.get(ClientGoalService);
        clientGoalController = moduleRef.get(ClientGoalController);
    });

    describe('findAll', () => {
        it('should return an array of client goals when service returns client goals', async () => {
            clientGoalServiceMock.findAll.mockResolvedValue(result);
            expect(await clientGoalController.findAll()).toEqual(result);
            expect(clientGoalServiceMock.findAll).toHaveBeenCalled();
        });
        it('should return empty array when service returns none', async () => {
            clientGoalServiceMock.findAll.mockResolvedValue([]);
            expect(await clientGoalController.findAll()).toEqual([]);
            expect(clientGoalServiceMock.findAll).toHaveBeenCalled();
        });
        it('should throw when service throws', async () => {
            clientGoalServiceMock.findAll.mockImplementation(() => { throw new Error('DB error'); });
            await expect(clientGoalController.findAll()).rejects.toThrow('DB error');
            expect(clientGoalServiceMock.findAll).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should create a client goal when service creates a client goal', async () => {
            clientGoalServiceMock.create.mockResolvedValue({ ...goal, id: 1 } as ClientGoal);
            expect(await clientGoalController.create(goal)).toEqual({ ...goal, id: 1 });
            expect(clientGoalServiceMock.create).toHaveBeenCalledWith(goal);
        });
        it('should throw when service throws', async () => {
            clientGoalServiceMock.create.mockImplementation(() => { throw new Error('DB error'); });
            await expect(clientGoalController.create(goal)).rejects.toThrow('DB error');
            expect(clientGoalServiceMock.create).toHaveBeenCalledWith(goal);
        });
    });
});