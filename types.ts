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
}

export interface FilterState {
  city: string;
  year: string;
  month: string;
  format: string;
  vendor: string;
}

export interface KPIData {
  avgGrp: number;
  totalOts: number;
  uniqueSurfaces: number;
  percentAboveAvg: number;
}

export enum TabView {
  ANALYTICS = 'ANALYTICS',
  MAP = 'MAP'
}