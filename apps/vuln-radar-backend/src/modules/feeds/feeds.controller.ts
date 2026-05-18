import { Controller, Get } from '@nestjs/common';
import { FeedsService } from './feeds.service';

@Controller()
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @Get('overview')
  getOverview() {
    return this.feedsService.getOverview();
  }

  @Get('feed')
  getFeed() {
    return this.feedsService.getFeed();
  }

  @Get('kev')
  getKev() {
    return this.feedsService.getKev();
  }

  @Get('watchlist')
  getWatchlist() {
    return this.feedsService.getWatchlist();
  }

  @Get('alerts')
  getAlerts() {
    return this.feedsService.getAlerts();
  }
}
