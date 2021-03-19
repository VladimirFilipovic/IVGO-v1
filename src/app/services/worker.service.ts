import { Injectable, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Subject, Subscription } from 'rxjs';
import { Worker } from '../models/worker';
import { HourlyRate } from '../models/hourly-rate';
import { element } from 'protractor';
import { isUndefined } from 'util';
import { Payment } from '../models/payment';
import { Utilities } from '../utilities';
import { WorkerDetailsByDate } from '../models/workerDetailsByDate';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {

  constructor(private db: AngularFirestore, private utilities: Utilities) { }

  private workers: Worker[] = [];
  private worker: Worker;
  private hourlyRates: HourlyRate[] = [];
  private workersUpdated = new Subject<Worker[]>();
  private workerUpdated = new Subject<Worker>();
  private workersSub: Subscription;
  private hourlyRatesUpdated = new Subject<HourlyRate[]>();
  private payments: Payment[] = [];
  private paymentsUpdated = new Subject<Payment[]>();
  private workerDaysByMonthUpdated = new Subject<{
    workerDetailsForMonth: WorkerDetailsByDate,
    workerDetailsForDays: {
      day: string,
      workerDetails: WorkerDetailsByDate
    }[]
  }>();
  private workerDayUpdated = new Subject<WorkerDetailsByDate>();
  private workerYearUpdated = new Subject<WorkerDetailsByDate>();

  getWorkersFromDB() {
    this.workers = [];
    const workersCollection: AngularFirestoreCollection<Worker> =
    this.db.collection<Worker>('workers');
    this.workersSub = workersCollection.stateChanges().subscribe(dat => {
      dat.forEach(d => {
        const w: Worker = {
          id: d.payload.doc.id,
          name: d.payload.doc.get('name'),
          surname: d.payload.doc.get('surname'),
          address: d.payload.doc.get('address'),
          phone: d.payload.doc.get('phone'),
          totalWorkHours: d.payload.doc.get('totalWorkHours'),
          medicalExamDate: this.timestampToDate(d.payload.doc.get('medicalExamDate')),
          medicalExamExpirationDate: this.timestampToDate(d.payload.doc.get('medicalExamExpirationDate')),
          contractDate: this.timestampToDate(d.payload.doc.get('contractDate')),
          contractExpirationDate: this.timestampToDate(d.payload.doc.get('contractExpirationDate')),
          totalSalary: d.payload.doc.get('totalSalary'),
          totalDebt: d.payload.doc.get('totalDebt'),
          status: d.payload.doc.get('status'),
          hourlyRateDate: this.timestampToDate(d.payload.doc.get('hourlyRateDate')),
          lastTwoHourlyRates: d.payload.doc.get('lastTwoHourlyRates'),
          hourlyRate: d.payload.doc.get('hourlyRate'),
          delegatedForDate: this.timestampToDate(d.payload.doc.get('delegatedForDate'))
        };
        this.workers.push(w);
      });
      this.workersUpdated.next([...this.workers]);
    });
  }

  getWorkersUpdateListener() {
    return this.workersUpdated.asObservable();
  }

  sendWorkerToDB(worker: Worker, hourlyRate: HourlyRate) {

      this.db.collection('workers').doc(worker.id).set(worker);
      this.db.collection('workers').doc(worker.id).collection('HourlyRates').add(hourlyRate);

  }

  updateWorker(worker: Worker, hourlyRate: HourlyRate, salaryChanged: boolean) {
    if (salaryChanged) {
      this.sendWorkerToDB(worker, hourlyRate);
    } else {
      this.db.collection('workers').doc(worker.id).update(worker);
    }

  }


  getWorkerFromDB(id: string) {
    const editWorkerRef = this.db.collection('workers').doc(id);
    editWorkerRef.get().subscribe((doc) => {
      // this.worker = doc.data() as Worker;
      // console.log('getWorkerFromDB(): ' + JSON.stringify(doc.data()));
      this.worker = {
        id: doc.data().id,
        name: doc.data().name,
        surname: doc.data().surname,
        address: doc.data().address,
        phone: doc.data().phone,
        totalWorkHours: doc.data().totalWorkHours,
        medicalExamDate: this.utilities.timestampToDate(doc.data().medicalExamDate),
        medicalExamExpirationDate: this.timestampToDate(doc.data().medicalExamExpirationDate),
        contractDate: this.timestampToDate(doc.data().contractDate),
        contractExpirationDate: this.timestampToDate(doc.data().contractExpirationDate),
        totalSalary: doc.data().totalSalary,
        totalDebt: doc.data().totalDebt,
        status: doc.data().status,
        hourlyRateDate: this.timestampToDate(doc.data().hourlyRateDate),
        lastTwoHourlyRates: doc.data().lastTwoHourlyRates,
        hourlyRate: doc.data().hourlyRate,
        delegatedForDate: this.timestampToDate(doc.data().delegatedForDate)
      };
      console.log('getWorkerFromDB(): ', this.worker);
      this.workerUpdated.next(this.worker);
    });
  }
  getWorkerUpdateListener() {
    return this.workerUpdated.asObservable();
  }

  changeWorkerStatus(id: string, newStatus: boolean) {
    this.db.collection('workers').doc(id).update({status: newStatus});
  }

  getHourlyRates(id: string) {
    this.hourlyRates = [];
    const hourlyRatesRef: AngularFirestoreCollection<HourlyRate> =
    this.db.collection<Worker>('workers').doc(id).collection<HourlyRate>('HourlyRates');
    hourlyRatesRef.stateChanges().subscribe(data => {
      data.forEach(d => {
        const hourlyRate: HourlyRate = {
          workerId: d.payload.doc.id,
          ammount: d.payload.doc.get('ammount'),
          date: this.utilities.timestampToDate(d.payload.doc.get('date'))
        };
        this.hourlyRates.push(hourlyRate);
      });
      this.hourlyRatesUpdated.next([...this.hourlyRates]);
    });
  }

  getHourlyRatesUpdateListener() {
    return this.hourlyRatesUpdated.asObservable();
  }

  generateID() {
    return this.db.createId();
  }

  updateWorkerDelegationForDate(worker: Worker) {
    worker.delegatedForDate = new Date();
    this.db.collection('workers').doc(worker.id).update(worker);
    const ind = this.workers.findIndex(w => w.id === worker.id);
    this.workers[ind] = worker;
    this.workersUpdated.next([...this.workers]);
  }

  setWorkerDelegatedDateToUndelegated(worker: Worker) {
    worker.delegatedForDate = new Date(0);
    this.db.collection('workers').doc(worker.id).update(worker);
    this.workers = this.workers.filter(w => {
      return w.id !== worker.id;
    });
    this.workersUpdated.next([...this.workers]);
  }

  timestampToDate(timestamp: any) {
    if (timestamp === undefined || timestamp === null || timestamp.seconds === undefined) {
      console.log('datum je undefined');
      return new Date(0);
    }
    try {
      // console.log('datum ime timestamp');
      return new Date(timestamp.seconds * 1000);
    } catch {
      console.log('timestamp catch', timestamp);
      return new Date(0);
    }
  }

  sendPaymentToDB(workerId: string, payment: Payment) {
    this.db.collection('workers').doc(workerId).collection('payments').doc(payment.id).set(payment);
  }

  getPayments(id: string) {
    console.log('worker.service: getPayments(): id: ', id);
    this.payments = [];
    const paymentsRef: AngularFirestoreCollection<Payment[]> =
    this.db.collection<Worker>('workers').doc(id).collection<Payment[]>('payments');
    paymentsRef.stateChanges().subscribe(data => {
      data.forEach(d => {
        const payment: Payment = {
          id: d.payload.doc.id,
          managersId: d.payload.doc.get('managersId'),
          managersName: d.payload.doc.get('managersName'),
          managersSurname: d.payload.doc.get('managersSurname'),
          managersParentsName: d.payload.doc.get('managersParentsName'),
          amount: d.payload.doc.get('amount'),
          date: this.timestampToDate(d.payload.doc.get('date'))
        };
        this.payments.push(payment);
      });
      this.paymentsUpdated.next([...this.payments]);
    });
  }

  getPaymentsUpdateListener() {
    return this.paymentsUpdated.asObservable();
  }

  getWorkerDaysByMonth(month: number, year: number) {
    this.db.collection('workers').doc(this.worker.id)
    .collection('year').doc(year.toString())
    .collection('month').doc(month.toString())
    .get().subscribe(documentSnapshot => {
      // console.log(documentSnapshot.data() as WorkerDetailsByDate);
      const workerDetailsForMonth = documentSnapshot.data() as WorkerDetailsByDate;

      this.db.collection('workers').doc(this.worker.id)
      .collection('year').doc(year.toString())
      .collection('month').doc(month.toString())
      .collection('day').get().subscribe(querySnapshot => {
        // console.log('querySnapshot.docs[0].data(): ', querySnapshot.docs[0].data() as WorkerDetailsByDate );
        const workerDetailsForDays: {
          day: string,
          workerDetails: WorkerDetailsByDate
        }[] = [];
        querySnapshot.docs.forEach(doc => {
          // console.log(doc.data() as WorkerDetailsByDate);
          workerDetailsForDays.push({
            day: doc.id,
            workerDetails: doc.data() as WorkerDetailsByDate
          });
        });
        this.workerDaysByMonthUpdated.next({workerDetailsForMonth, workerDetailsForDays});
      });

    });
  }

  getWorkerDaysByMonthUpdateListener() {
    return this.workerDaysByMonthUpdated.asObservable();
  }

  getWorkerDay(date: Date) {
    this.db.collection('workers').doc(this.worker.id)
    .collection('year').doc(date.getFullYear().toString())
    .collection('month').doc((date.getMonth() + 1).toString())
    .collection('day').doc(date.getDate().toString())
    .get().subscribe(documentSnapshot => {
      const workerDetailsForDay = documentSnapshot.data() as WorkerDetailsByDate;
      this.workerDayUpdated.next(workerDetailsForDay);
    });
  }

  getWorkerDayUpdateListener() {
    return this.workerDayUpdated.asObservable();
  }

  getWorkerYear(year: string) {
    this.db.collection('workers').doc(this.worker.id)
    .collection('year').doc(year)
    .get().subscribe(documentSnapshot => {
      const workerDetailsForYear = documentSnapshot.data() as WorkerDetailsByDate;
      this.workerYearUpdated.next(workerDetailsForYear);
    });
  }

  getWorkerYearUpdateListener() {
    return this.workerYearUpdated.asObservable();
  }
}
