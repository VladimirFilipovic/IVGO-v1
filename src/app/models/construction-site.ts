import { Worker } from './worker';

export interface ConstructionSite {
  id: string;
  name: string;
  address: string;
  active: boolean;
  openingDate: Date;
  closingDate: Date;
  totalSalaryGiven: number;
  hourlyRateAvg: number;
  totalWorkHours: number;
  totalCostOfSubCategories: number;
  listOfWorkers: {worker: Worker, workHours: number}[];
}
