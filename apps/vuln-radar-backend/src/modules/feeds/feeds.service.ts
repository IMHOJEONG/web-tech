import { Injectable } from '@nestjs/common';
import {
  getAlertsResponse,
  getFeedResponse,
  getOverviewResponse,
  getWatchlistResponse,
} from '../../shared/data/mock-radar-data';

@Injectable()
export class FeedsService {
  getOverview() {
    return getOverviewResponse();
  }

  getFeed() {
    return getFeedResponse();
  }

  getWatchlist() {
    return getWatchlistResponse();
  }

  getAlerts() {
    return getAlertsResponse();
  }
}
