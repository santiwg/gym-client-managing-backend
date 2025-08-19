import { Test, TestingModule } from '@nestjs/testing';
import { BloodTypeController } from './blood-type.controller';

describe('BloodTypeController', () => {
  let controller: BloodTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BloodTypeController],
    }).compile();

    controller = module.get<BloodTypeController>(BloodTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
