import { ConstructionSite } from './construction-site';
import { ConstructionSiteDetailsComponent } from '../construction-site-details/construction-site-details.component';

export interface ConstructionSiteMonthly {
  days: number;
  HourlyRateAvg: number;
  totalWorkHours: number;
}
