import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { parseFeedQuery } from './feed-query';
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

  @Get('feed/search')
  searchFeed(@Query() query: Record<string, unknown>) {
    return this.feedsService.searchFeed(parseFeedQuery(query));
  }

  @Get('watchlist')
  getWatchlist() {
    return this.feedsService.getWatchlist();
  }

  @Get('alerts')
  getAlerts() {
    return this.feedsService.getAlerts();
  }

  @Get('vulnerabilities/:cveId')
  getVulnerabilityDetail(@Param('cveId') cveId: string) {
    return this.feedsService.getVulnerabilityDetail(cveId);
  }
}
