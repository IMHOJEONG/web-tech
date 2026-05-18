import { Test, TestingModule } from '@nestjs/testing';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';

describe('FeedsController', () => {
  let feedsController: FeedsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FeedsController],
      providers: [FeedsService],
    }).compile();

    feedsController = app.get<FeedsController>(FeedsController);
  });

  it('returns overview cards', () => {
    const response = feedsController.getOverview();

    expect(response.cards.length).toBeGreaterThan(0);
    expect(response.cards[0]).toMatchObject({
      id: 'p0-open',
      priority: 'P0',
    });
  });

  it('returns feed items', () => {
    const response = feedsController.getFeed();

    expect(response.items.length).toBeGreaterThan(0);
    expect(response.items[0]?.cveId).toBe('CVE-2026-10001');
  });
});
