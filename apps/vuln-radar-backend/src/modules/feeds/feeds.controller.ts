import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';

@Controller()
@UseGuards(BackendAuthGuard)
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
