export type WatchlistType = 'vendor' | 'product' | 'ecosystem' | 'keyword';

export interface WatchlistAdminEntry {
  id: string;
  type: WatchlistType;
  value: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistListResponse {
  items: WatchlistAdminEntry[];
  total: number;
}

export interface CreateWatchlistEntryInput {
  type: WatchlistType;
  value: string;
  enabled: boolean;
}

export interface UpdateWatchlistEntryInput {
  type?: WatchlistType;
  value?: string;
  enabled?: boolean;
}

export interface DeleteWatchlistEntryResponse {
  deleted: true;
  id: string;
}
