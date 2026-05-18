import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { FeedsController } from './feeds.controller';
import { FeedsRepository } from './feeds.repository';
import { FeedsService } from './feeds.service';

describe('FeedsController', () => {
  let feedsController: FeedsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FeedsController],
      providers: [
        FeedsService,
        FeedsRepository,
        {
          provide: PrismaService,
          useValue: {
            getClient: async () => null,
          },
        },
      ],
    }).compile();

    feedsController = app.get<FeedsController>(FeedsController);
  });

  it('returns overview cards', async () => {
    const response = await feedsController.getOverview();

    expect(response.cards.length).toBeGreaterThan(0);
    expect(response.cards[0]).toMatchObject({
      id: 'p0-open',
      priority: 'P0',
    });
  });

  it('returns feed items', async () => {
    const response = await feedsController.getFeed();

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items[0]?.cveId).toBe('CVE-2026-10001');
  });

  it('returns kev items', async () => {
    const response = await feedsController.getKev();

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items[0]?.cveId).toBe('CVE-2026-10001');
  });
});
