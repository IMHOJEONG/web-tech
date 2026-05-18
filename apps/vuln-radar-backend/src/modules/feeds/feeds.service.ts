import { Injectable } from '@nestjs/common';
import { FeedsRepository } from './feeds.repository';

@Injectable()
export class FeedsService {
  constructor(private readonly feedsRepository: FeedsRepository) {}

  getOverview() {
    return this.feedsRepository.getOverview();
  }

  getFeed() {
    return this.feedsRepository.getFeed();
  }

  getWatchlist() {
    return this.feedsRepository.getWatchlist();
  }

  getAlerts() {
    return this.feedsRepository.getAlerts();
  }
}
