export interface OOHRecord {
  id: string;
  address: string;
  city: string;
  year: number;
  month: string;
  vendor: string;
  format: string;
  grp: number;
  ots: number;
  lat: number;
  lng: number;
  dateLabel: string; // Новое поле: "окт 2025"
}

export interface FilterState {
  city: string;
  year: string;
  month: string;
  format: string;
  vendor: string;
}

export enum TabView {
  ANALYTICS = 'analytics',
  MAP = 'map'
}
