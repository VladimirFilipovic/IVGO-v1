import { HourlyRate } from './hourly-rate';

export interface Worker {
    id: string;
    name: string;
    surname: string;
    address: string;
    phone: string;
    totalWorkHours: number;
    medicalExamDate: Date;
    medicalExamExpirationDate: Date;
    contractDate: Date;
    contractExpirationDate: Date;
    totalSalary: number;
    totalDebt: number;
    status: boolean;
    hourlyRateDate: Date;
    lastTwoHourlyRates: HourlyRate[];
    hourlyRate: number;
    delegatedForDate: Date;
}
