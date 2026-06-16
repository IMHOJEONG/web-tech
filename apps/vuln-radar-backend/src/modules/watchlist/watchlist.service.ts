import { Injectable } from '@nestjs/common';
import { WatchlistRepository } from './watchlist.repository';
import {
  CreateWatchlistEntryInput,
  DeleteWatchlistEntryResponse,
  UpdateWatchlistEntryInput,
  WatchlistListResponse,
} from './watchlist.types';

@Injectable()
export class WatchlistService {
  constructor(private readonly watchlistRepository: WatchlistRepository) {}

  async listEntries(): Promise<WatchlistListResponse> {
    const items = await this.watchlistRepository.listEntries();

    return {
      items,
      total: items.length,
    };
  }

  createEntry(input: CreateWatchlistEntryInput) {
    return this.watchlistRepository.createEntry(input);
  }

  updateEntry(id: string, input: UpdateWatchlistEntryInput) {
    return this.watchlistRepository.updateEntry(id, input);
  }

  async deleteEntry(id: string): Promise<DeleteWatchlistEntryResponse> {
    await this.watchlistRepository.deleteEntry(id);

    return {
      deleted: true,
      id,
    };
  }
}
