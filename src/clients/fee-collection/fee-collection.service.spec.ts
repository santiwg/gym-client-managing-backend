import { Test, TestingModule } from '@nestjs/testing';
import { FeeCollectionService } from './fee-collection.service';

describe('FeeCollectionService', () => {
  let service: FeeCollectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
  providers: [FeeCollectionService],
    }).compile();

  service = module.get<FeeCollectionService>(FeeCollectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
