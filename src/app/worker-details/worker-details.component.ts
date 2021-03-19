import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Worker } from '../models/worker';
import { FormControl, FormGroup, Validators, NgForm } from '@angular/forms';
import { HourlyRate } from '../models/hourly-rate';
import { WorkerService } from '../services/worker.service';
import { Subscription } from 'rxjs';
import { Payment } from '../models/payment';
import { isUndefined } from 'util';
import { EarnedOnConstructionSite } from '../models/earned-on-construction-site';
import { ConstructionSite } from '../models/construction-site';
import { CommentStmt } from '@angular/compiler';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material';
import { WorkerDetailsByDate } from '../models/workerDetailsByDate';

@Component({
  selector: 'app-worker-details',
  templateUrl: './worker-details.component.html',
  styleUrls: ['./worker-details.component.css']
})
export class WorkerDetailsComponent implements OnInit, OnDestroy {

  worker: Worker;
  workerDetailsForm: FormGroup;
  paymentForm: FormGroup;
  viewByDayFormGroup: FormGroup;
  viewByMonthFormGroup: FormGroup;
  hourlyRates: HourlyRate[] = [];
  private hourlyRatesSub: Subscription;
  payments: Payment[] = [];
  private paymentsSub: Subscription;

  private workerSub: Subscription;
  showAllHourlyRates = false;
  paymentsVisibility = false;
  years = [];
  months = [];
  selectedMonth: number;
  selectedYear: number;

  workerDetailsForMonthAndDays: {
    workerDetailsForMonth: WorkerDetailsByDate,
    workerDetailsForDays: {
      day: string,
      workerDetails: WorkerDetailsByDate
    }[]
  };
  workerDetailsForDay: WorkerDetailsByDate;
  workerDetailsForYear: WorkerDetailsByDate;

  constructor(
    private route: ActivatedRoute,
    private db: AngularFirestore,
    public workerService: WorkerService) { }

  ngOnInit() {
    this.viewByDayFormGroup = new FormGroup({
      month: new FormControl(null)
    });

    const today = new Date();

    for (let year = 2017; year <= today.getFullYear(); year++) {
      this.years.push(year);
    }
    this.months = [
      {value: 1, name: 'januar'},
      {value: 2, name: 'februar'},
      {value: 3, name: 'mart'},
      {value: 4, name: 'april'},
      {value: 5, name: 'maj'},
      {value: 6, name: 'jun'},
      {value: 7, name: 'jul'},
      {value: 8, name: 'avgust'},
      {value: 9, name: 'sepembar'},
      {value: 10, name: 'oktobar'},
      {value: 11, name: 'novembar'},
      {value: 12, name: 'decembar'}
    ];

    this.paymentForm = new FormGroup({
      amount: new FormControl(null, { validators: [Validators.required] })
    });

    const id = this.route.snapshot.paramMap.get('id');
    console.log(id);
    this.workerService.getWorkerFromDB(id);
    this.workerSub = this.workerService.getWorkerUpdateListener()
    .subscribe((data: Worker) => {
      this.worker = data;
    });
  }

  changeWorkerStatus() {
    if (confirm('Da li ste sigurni?')) {
      this.worker.status = false;
      this.workerService.changeWorkerStatus(this.worker.id, this.worker.status);
    }
  }

  public sortingByDate(list: HourlyRate[]): HourlyRate[] {
    list.sort((a: HourlyRate, b: HourlyRate) => {
      return b.date.seconds - a.date.seconds;
    });
    return list;
  }

  dateToMonth(date: Date) {
    const monthNames = [
      'januar',
      'februar',
      'mart',
      'april',
      'maj',
      'jun',
      'jul',
      'avgust',
      'septembar',
      'oktobar',
      'novembar',
      'decembar'
    ];
    return monthNames[date.getMonth()];
  }
  // ovo treb biti u servisu
  // kreirati payment service
  payWorker(worker: Worker, paymentForm: NgForm) {
    let paymentAmount = paymentForm.value.amount;
    worker.totalSalary = worker.totalSalary - paymentForm.value.amount;
    worker.totalDebt = worker.totalDebt - paymentForm.value.amount;
    if (worker.totalDebt <= 0) {
      worker.totalDebt = 0;
    }
    const hourlyRate: HourlyRate = {
      workerId: worker.id,
      ammount: worker.hourlyRate,
      date: worker.hourlyRateDate
    };
    console.log(hourlyRate);
    this.workerService.updateWorker(worker, hourlyRate, false);
    const earningsCollection: AngularFirestoreCollection<EarnedOnConstructionSite> = 
    this.db.collection('workers').doc(worker.id).collection<EarnedOnConstructionSite>('paymentsByConstructionSite');
    let earnings: EarnedOnConstructionSite[] = [];
    earningsCollection.get().subscribe(dat => {
      dat.docs.forEach(d => {
        earnings.push(d.data() as EarnedOnConstructionSite);
      });
        let index = earnings.length - 1;
        let constructionSites: ConstructionSite[] = [];
        // memory leak treba dodati uslov
        console.log("Earning", earnings);
        const payment: Payment = {
          id: this.workerService.generateID(),
          managersId: "123",
          managersName: "Vasa",
          managersSurname: "Jovanovic",
          managersParentsName: "Dobrivoje",
          amount: paymentForm.value.amount,
          date: new Date()
        };
       
        this.db.collection('constructionSites').get().subscribe(doc =>{
           doc.docs.forEach(d => {
            constructionSites.push(d.data() as ConstructionSite);
            console.log("sta vraca iz foreacha", d.data());
          }); 
          while(payment.amount > 0 && index >= 0) {
            if(payment.amount >= earnings[index].totalEarned)
            {
              payment.amount  = payment.amount - earnings[index].totalEarned;
              console.log("index", index);
                console.log("Construction site in earnings", constructionSites);
                console.log("earning koji kaze da je undefined", earnings[index]);
                let cs: ConstructionSite = constructionSites.find(p => p.id == earnings[index].id);
                console.log("cs", cs);
                cs.totalSalaryGiven += earnings[index].totalEarned;
                earnings[index].totalEarned = 0;
                this.db.collection('workers').doc(worker.id).collection('paymentsByConstructionSite')
                .doc(earnings[index].id).set(earnings[index]);
                this.db.collection('constructionSites').doc(cs.id).set(cs);   
               index--;
            } else {
                let cs: ConstructionSite = constructionSites.find(p => p.id == earnings[index].id);
                cs.totalSalaryGiven += payment.amount;
                earnings[index].totalEarned = earnings[index].totalEarned - payment.amount;
                payment.amount  = payment.amount - earnings[index].totalEarned;
                this.db.collection('workers').doc(worker.id).collection('paymentsByConstructionSite')
                .doc(earnings[index].id).set(earnings[index]);
                this.db.collection('constructionSites').doc(cs.id).set(cs);  
                index--;
          }
        }
        });
      });
     
    

      
    
    //vratiti sve workerove zarade -> u neki niz;
    //while(payment nije jednak nuli i dok ima sledeceg u nizu,listi)
    //oduzmes od paymenta zaradu -> znamo koliko jos treba isplatimo
    // i od zarade payment da bi znali koliko smo ispraznili zaradu
    // na gradiliste dodamo zaradu koja je vezana za njega -> znamo po id-u same zarade
    //sve save
    const payment: Payment = {
      id: this.workerService.generateID(),
      managersId: '123',
      managersName: 'Vasa',
      managersSurname: 'Jovanovic',
      managersParentsName: 'Dobrivoje',
      amount: paymentForm.value.amount,
      date: new Date()
    };
    this.workerService.sendPaymentToDB(worker.id, payment);
  }

  changeShowAllHourlyRates() {
    this.showHourlyRates();
    this.showAllHourlyRates = !this.showAllHourlyRates;
  }

  showHourlyRates() {
    this.workerService.getHourlyRates(this.worker.id);
    this.hourlyRatesSub = this.workerService.getHourlyRatesUpdateListener()
    .subscribe((hourlyRates: HourlyRate[]) => {
      this.hourlyRates = hourlyRates;
    });
  }

  changePaymentsVisibility() {
    this.showPayments();
    this.paymentsVisibility = !this.paymentsVisibility;
  }

  showPayments() {
    this.workerService.getPayments(this.worker.id);
    this.paymentsSub = this.workerService.getPaymentsUpdateListener()
    .subscribe((data: Payment[]) => {
      this.payments = data;
    });
  }

  yearSelected(year: number) {
    console.log('yearSelected(): year: ', year);
    this.selectedYear = year;
    if (this.selectedMonth !== undefined) {
      this.getWorkerDaysByMonth();
    }
  }

  monthSelected(monthValue: number) {
    console.log('monthSelected(): month: ', monthValue);
    this.selectedMonth = monthValue;
    if (this.selectedYear !== undefined) {
      this.getWorkerDaysByMonth();
    }
  }

  getWorkerDaysByMonth() {
    console.log('getWorkerDaysByMonth()');
    this.workerService.getWorkerDaysByMonth(this.selectedMonth, this.selectedYear);
    this.workerService.getWorkerDaysByMonthUpdateListener().subscribe(data => {
      this.workerDetailsForMonthAndDays = data;
      console.log('this.workerDetailsForMonthAndDays: ', this.workerDetailsForMonthAndDays);
    });
  }

  daySelected(day: Date) {
    this.workerService.getWorkerDay(day);
    this.workerService.getWorkerDayUpdateListener().subscribe(data => {
      this.workerDetailsForDay = data;
    });
  }

  onlyYearSelected(year: string) {
    this.workerService.getWorkerYear(year);
    this.workerService.getWorkerYearUpdateListener().subscribe(data => {
      this.workerDetailsForYear = data;
      console.log('this.workerDetailsForYear: ', this.workerDetailsForYear);
    });
  }

  ngOnDestroy(): void {
    if (!isUndefined(this.paymentsSub)) {
      this.paymentsSub.unsubscribe();
    }
  }
}
