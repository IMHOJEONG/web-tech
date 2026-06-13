import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../../config/app-config.service';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

describe('WatchlistController', () => {
  let watchlistController: WatchlistController;

  const watchlistService = {
    listEntries: jest.fn(async () => ({
      items: [
        {
          id: 'entry-1',
          type: 'product' as const,
          value: 'react',
          enabled: true,
          createdAt: '2026-06-13T00:00:00.000Z',
          updatedAt: '2026-06-13T00:00:00.000Z',
        },
      ],
      total: 1,
    })),
    createEntry: jest.fn(async (input) => ({
      id: 'entry-2',
      ...input,
      createdAt: '2026-06-13T00:00:00.000Z',
      updatedAt: '2026-06-13T00:00:00.000Z',
    })),
    updateEntry: jest.fn(async (id, input) => ({
      id,
      type: input.type ?? 'product',
      value: input.value ?? 'react',
      enabled: input.enabled ?? true,
      createdAt: '2026-06-13T00:00:00.000Z',
      updatedAt: '2026-06-13T01:00:00.000Z',
    })),
    deleteEntry: jest.fn(async (id) => ({
      deleted: true as const,
      id,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistController],
      providers: [
        {
          provide: WatchlistService,
          useValue: watchlistService,
        },
        {
          provide: BackendAuthGuard,
          useValue: {
            canActivate: () => true,
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            backendApiToken: 'test-token',
          },
        },
      ],
    }).compile();

    watchlistController = app.get<WatchlistController>(WatchlistController);
  });

  it('returns admin watchlist entries', async () => {
    const response = await watchlistController.listEntries();

    expect(response.total).toBe(1);
    expect(response.items[0]?.value).toBe('react');
  });

  it('normalizes create payloads before forwarding them', async () => {
    const response = await watchlistController.createEntry({
      type: 'product',
      value: ' React ',
      enabled: true,
    });

    expect(watchlistService.createEntry).toHaveBeenCalledWith({
      type: 'product',
      value: 'react',
      enabled: true,
    });
    expect(response.value).toBe('react');
  });

  it('forwards partial updates', async () => {
    const response = await watchlistController.updateEntry('entry-1', {
      enabled: false,
    });

    expect(watchlistService.updateEntry).toHaveBeenCalledWith('entry-1', {
      enabled: false,
    });
    expect(response.enabled).toBe(false);
  });
});
