export interface ApiResponse {
  total_rows: number;
  offset: number;
  rows: Row[];
}

export interface Row {
  id: string;
  key: string;
  value: {
    rev: string;
  };
}
