import { HourlyRate } from './hourly-rate';

export interface WorkerDetailsByDate {
  totalWorkHours: number;
  hourlyRate: number;
  constructionSiteName: string;
  totalSalary: number;
  constructionSiteId: string;
}
