import { Test, TestingModule } from '@nestjs/testing';
import { BloodTypeService } from './blood-type.service';

describe('BloodTypeService', () => {
  let service: BloodTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BloodTypeService],
    }).compile();

    service = module.get<BloodTypeService>(BloodTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
