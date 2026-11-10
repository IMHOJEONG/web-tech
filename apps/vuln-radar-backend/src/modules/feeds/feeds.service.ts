import { Injectable } from '@nestjs/common';
import { FeedsRepository } from './feeds.repository';
import type { FeedQuery } from './feed-query';

@Injectable()
export class FeedsService {
  constructor(private readonly feedsRepository: FeedsRepository) {}

  getOverview() {
    return this.feedsRepository.getOverview();
  }

  getFeed() {
    return this.feedsRepository.getFeed();
  }

  searchFeed(query: FeedQuery) {
    return this.feedsRepository.searchFeed(query);
  }

  getKev() {
    return this.feedsRepository.getKev();
  }

  getWatchlist() {
    return this.feedsRepository.getWatchlist();
  }

  getAlerts() {
    return this.feedsRepository.getAlerts();
  }

  getVulnerabilityDetail(cveId: string) {
    return this.feedsRepository.getVulnerabilityDetail(cveId);
  }
}
