import { Module } from '@nestjs/common';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';
import { WatchlistController } from './watchlist.controller';
import { WatchlistRepository } from './watchlist.repository';
import { WatchlistService } from './watchlist.service';

@Module({
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchlistRepository, BackendAuthGuard],
})
export class WatchlistModule {}
