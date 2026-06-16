import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';
import { WatchlistService } from './watchlist.service';
import {
  parseCreateWatchlistEntryInput,
  parseUpdateWatchlistEntryInput,
} from './watchlist.validation';

@Controller('admin/watchlist')
@UseGuards(BackendAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  listEntries() {
    return this.watchlistService.listEntries();
  }

  @Post()
  createEntry(@Body() body: unknown) {
    return this.watchlistService.createEntry(
      parseCreateWatchlistEntryInput(body),
    );
  }

  @Patch(':id')
  updateEntry(@Param('id') id: string, @Body() body: unknown) {
    return this.watchlistService.updateEntry(
      id,
      parseUpdateWatchlistEntryInput(body),
    );
  }

  @Delete(':id')
  deleteEntry(@Param('id') id: string) {
    return this.watchlistService.deleteEntry(id);
  }
}
