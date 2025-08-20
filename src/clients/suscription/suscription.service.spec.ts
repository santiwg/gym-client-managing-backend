import { Test, TestingModule } from '@nestjs/testing';
import { SuscriptionService } from './suscription.service';

describe('SuscriptionService', () => {
  let service: SuscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuscriptionService],
    }).compile();

    service = module.get<SuscriptionService>(SuscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
