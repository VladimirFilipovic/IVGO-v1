import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { ConstructionSite } from '../models/construction-site';
import { Subject, Subscription } from 'rxjs';
import { Category } from '../models/category';
import { CategoryCost } from '../models/category-cost';
import { Worker } from '../models/worker';
import { ConstructionSiteDaily } from '../models/day';
import { ConstructionSiteMonthly } from '../models/month';
import { ConstructionSiteYearly } from '../models/year';
import { isUndefined } from 'util';
import { WorkerService } from './worker.service';
import { WorkerDetailsByDate } from '../models/workerDetailsByDate';
import { EarnedOnConstructionSite } from '../models/earned-on-construction-site';

@Injectable({
  providedIn: 'root'
})
export class ConstructionSiteService {
  sameAsYesterday(constructionSite: ConstructionSite) {
    throw new Error("Method not implemented.");
  }
  private constructionSiteUpdated = new Subject<ConstructionSite>();

  private constructionSites: ConstructionSite[] = [];
  private constructionSitesUpdated = new Subject<ConstructionSite[]>();
  private constructionSite: ConstructionSite;
  workers: Worker[];
  private constructionSiteWorkersUpdated = new Subject<Worker[]>();
  private categories: Category[] = [];
  private categoriesUpdated = new Subject<Category[]>();
  private categoryCostSub: Subscription;

  constructor(
    private db: AngularFirestore,
    private workerService: WorkerService
  ) {}

  sendConstructionSiteToDB(constructionSite: ConstructionSite) {
    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .set(constructionSite);
  }

  updateConstructionSite(constructionSite: ConstructionSite) {
    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .update(constructionSite);
  }

  generateID() {
    return this.db.createId();
  }

  getConstructionSiteFromDB(id: string) {
    const constructionSiteRef = this.db.collection('constructionSites').doc(id);
    constructionSiteRef.get().subscribe(doc => {
      this.constructionSite = {
        id: doc.data().id,
        name: doc.data().name,
        address: doc.data().address,
        active: doc.data().active,
        openingDate: this.timestampToDate(doc.data().openingDate),
        closingDate: this.timestampToDate(doc.data().closingDate),
        totalSalaryGiven: doc.data().totalSalaryGiven,
        hourlyRateAvg: doc.data().hourlyRateAvg,
        totalWorkHours: doc.data().totalWorkHours,
        totalCostOfSubCategories: doc.data().totalCostOfSubCategories,
        listOfWorkers:  this.listOfWorkersTimestampToDate(doc.data().listOfWorkers)
      };
      console.log('construction-site.service: getConstructionSiteFromDB(): ', this.constructionSite);
      this.constructionSiteUpdated.next(this.constructionSite);
    });
  }

  getConstructionSiteUpdateListener() {
    return this.constructionSiteUpdated.asObservable();
  }

  // getConstructionSites() {
  //   this.constructionSites = [];
  //   const constructionSitesRef: AngularFirestoreCollection<ConstructionSite> =
  //     this.db.collection<ConstructionSite>('constructionSites');
  //   // constructionSitesRef.stateChanges().subscribe(data => { // sa snapshotChanges() ne radi kad se builduje
  //   constructionSitesRef.stateChanges().subscribe(data => {
  //     data.forEach(d => {
  //       const constructionSite: ConstructionSite = {
  //         id: d.payload.doc.id,
  //         name: d.payload.doc.get('name'),
  //         address: d.payload.doc.get('address'),
  //         active: d.payload.doc.get('active'),
  //         openingDate: this.timestampToDate(d.payload.doc.get('openingDate')),
  //         closingDate: this.timestampToDate(d.payload.doc.get('closingDate')),
  //         totalSalaryGiven: d.payload.doc.get('totalSalaryGiven'),
  //         hourlyRateAvg: d.payload.doc.get('hourlyRateAvg'),
  //         totalWorkHours: d.payload.doc.get('totalWorkHours'),
  //         totalCostOfSubCategories: d.payload.doc.get(
  //           'totalCostOfSubCategories'
  //         ),
  //         listOfWorkers: this.listOfWorkersTimestampToDate(
  //           d.payload.doc.get('listOfWorkers')
  //         )
  //       };
  //       this.constructionSites.push(constructionSite);
  //     });
  //     this.constructionSitesUpdated.next([...this.constructionSites]);
  //   });
  // }

  getConstructionSites() {
    this.constructionSites = [];
    this.db.collection<ConstructionSite>('constructionSites').get().subscribe(querySnapshot => {
      querySnapshot.docs.forEach(doc => {
        const constructionSite: ConstructionSite = {
          id: doc.id,
          name: doc.get('name'),
          address: doc.get('address'),
          active: doc.get('active'),
          openingDate: this.timestampToDate(doc.get('openingDate')),
          closingDate: this.timestampToDate(doc.get('closingDate')),
          totalSalaryGiven: doc.get('totalSalaryGiven'),
          hourlyRateAvg: doc.get('hourlyRateAvg'),
          totalWorkHours: doc.get('totalWorkHours'),
          totalCostOfSubCategories: doc.get(
            'totalCostOfSubCategories'
          ),
          listOfWorkers: this.listOfWorkersTimestampToDate(
            doc.get('listOfWorkers')
          )
        };
        this.constructionSites.push(constructionSite);
      });
      this.constructionSitesUpdated.next([...this.constructionSites]);
    });
  }

  getConstructionSitesUpdateListener() {
    return this.constructionSitesUpdated.asObservable();
  }

  getCategories(constructionSiteId: string) {
    this.categories = [];
    this.categoryCostSub = this.db
      .collection('constructionSites')
      .doc(constructionSiteId)
      .collection('categories')
      .stateChanges()
      .subscribe(data => {
        data.forEach(d => {
          const category: Category = {
            id: d.payload.doc.id,
            categoryName: d.payload.doc.get('categoryName'),
            categoryCosts: this.categoryCostsTimestampToDate(
              d.payload.doc.get('categoryCosts')
            ),
            constructionSiteID: d.payload.doc.get('constructionSiteID'),
            totalCost: d.payload.doc.get('totalCost')
          };
          this.categories.push(category);
        });
        this.categoryCostSub.unsubscribe();
        this.categoriesUpdated.next([...this.categories]);
      });
  }

  getCategoriesUpdateListener() {
    return this.categoriesUpdated.asObservable();
  }

  addCategory(constructionSiteId: string, category: Category) {
    // const ifCathegoryExists = this.db.collection('constructionSites').doc(constructionSiteId).collection('categories').doc();
    this.db
      .collection('constructionSites')
      .doc(constructionSiteId)
      .collection('categories')
      .doc(category.id)
      .set(category);
    this.getCategories(constructionSiteId);
  }

  addCategoryCost(
    constructionSite: ConstructionSite,
    categoryCost: CategoryCost,
    category: Category
  ) {
    category.categoryCosts.push(categoryCost);
    constructionSite.totalCostOfSubCategories += categoryCost.amount;
    category.totalCost += categoryCost.amount;

    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .update(constructionSite);
    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('categories')
      .doc(category.id)
      .set(category);
  }

  addWorkHours(worker: Worker, constructionSite: ConstructionSite, workHours: number, workerRemovedFromDb: boolean) {
    // worker.totalWorkHours += workHours;
    // worker.totalDebt = worker.totalDebt + workHours * worker.hourlyRate;
    // worker.totalSalary = worker.totalSalary + workHours * worker.hourlyRate;
    // posle dodati u novoj kolekciji za radnike (gradilista)
    const difference = worker.totalSalary + workHours * worker.hourlyRate;
    if (workHours !== 0) {
      if(worker.totalSalary < 0 && difference > 0 ) {
      let workHoursCalculatedWithDifference = difference / worker.hourlyRate;
      this.addEarnedToWorker(worker, constructionSite, workHoursCalculatedWithDifference);
      } else if (worker.totalSalary > 0) {
      this.addEarnedToWorker(worker, constructionSite, workHours);
       }
      worker.totalWorkHours += workHours;
      worker.totalDebt = worker.totalDebt + workHours * worker.hourlyRate;
      worker.totalSalary = worker.totalSalary + workHours * worker.hourlyRate;
      this.workerHours(worker, workHours, constructionSite);
    }
    // note popravio sam kad je debt 0 to se desava ako je totalSalary = 0 -> dodao <=
    if (worker.totalSalary <= 0) {
      worker.totalDebt = 0;
    }

    if (worker.totalSalary < worker.totalDebt) {
      worker.totalDebt = worker.totalSalary;
    }

    constructionSite.totalWorkHours += workHours;

    const date: Date = new Date();

    const newDay: ConstructionSiteDaily = {
      totalWorkHours: workHours,
      hourlyRateAvg: worker.hourlyRate
    };

    const docref = this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .collection('day')
      .doc(date.getDate().toString());

    const docRefMonth = this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString());

    const docRefYear = this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(date.getFullYear().toString());

    docRefYear.get().subscribe(doc => {
      const year: ConstructionSiteYearly = doc.data() as ConstructionSiteYearly;
      console.log('year is ', year);
      docRefMonth.get().subscribe(doc1 => {
        const month: ConstructionSiteMonthly = doc1.data() as ConstructionSiteMonthly;
        docref.get().subscribe(doc2 => {
          const day: ConstructionSiteDaily = doc2.data() as ConstructionSiteDaily;
          switch (isUndefined(year)) {
            case true:
              this.addYear(constructionSite, newDay);
              console.log('year undefined');
              break;
            default:
              switch (isUndefined(month)) {
                case true:
                  this.addMonth(constructionSite, newDay, year);
                  break;
                default:
                  switch (isUndefined(day)) {
                    case true:
                      this.addDay(constructionSite, newDay, year, month);
                      break;
                    default:
                      this.updateDay(
                        constructionSite,
                        newDay,
                        year,
                        month,
                        day,
                        workerRemovedFromDb
                      );
                      break;
                  }
                  break;
              }
          }
          this.sendConstructionSiteToDB(constructionSite);
          this.db
            .collection('workers')
            .doc(worker.id)
            .set(worker);
        });
      });
    });
  }

  addYear(constructionSite: ConstructionSite, newDay: ConstructionSiteDaily) {
    const newYear: ConstructionSiteYearly = {
      months: 1,
      totalWorkHours: newDay.totalWorkHours,
      hourlyRateAvg: newDay.hourlyRateAvg
    };

    const newMonth: ConstructionSiteMonthly = {
      days: 1,
      totalWorkHours: newDay.totalWorkHours,
      HourlyRateAvg: newDay.hourlyRateAvg
    };

    this.db.collection('constructionSites').doc(constructionSite.id)
      .collection('year').doc((new Date()).getFullYear().toString()).
      collection('month').doc(((new Date()).getMonth() + 1).toString())
      .collection('day').doc(((new Date()).getDate()).toString()).set(newDay);

    this.db.collection('constructionSites').doc(constructionSite.id)
      .collection('year').doc((new Date()).getFullYear().toString())
      .collection('month').doc(((new Date()).getMonth() + 1).toString()).set(newMonth);

    this.db.collection('constructionSites').doc(constructionSite.id)
      .collection('year').doc((new Date()).getFullYear().toString()).set(newYear);
  }

  addMonth(
    constructionSite: ConstructionSite,
    newDay: ConstructionSiteDaily,
    year: ConstructionSiteYearly
  ) {
    const newMonth: ConstructionSiteMonthly = {
      days: 1,
      totalWorkHours: newDay.totalWorkHours,
      HourlyRateAvg: newDay.hourlyRateAvg
    };

    const newYear: ConstructionSiteYearly = {
      months: year.months + 1,
      totalWorkHours: year.totalWorkHours + newDay.totalWorkHours,
      hourlyRateAvg:
        (year.hourlyRateAvg * year.months + newDay.hourlyRateAvg) /
        (year.months + 1)
    };

    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(new Date().getFullYear().toString())
      .collection('month')
      .doc((new Date().getMonth() + 1).toString())
      .collection('day')
      .doc(new Date().getDate().toString())
      .set(newDay);

    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(new Date().getFullYear().toString())
      .collection('month')
      .doc((new Date().getMonth() + 1).toString())
      .set(newMonth);

    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(new Date().getFullYear().toString())
      .set(newYear);
  }

  addDay(
    constructionSite: ConstructionSite,
    newDay: ConstructionSiteDaily,
    year: ConstructionSiteYearly,
    month: ConstructionSiteMonthly
  ) {
    const newMonth: ConstructionSiteMonthly = {
      days: month.days + 1,
      totalWorkHours: month.totalWorkHours + newDay.totalWorkHours,
      HourlyRateAvg:
        (month.HourlyRateAvg * month.days + newDay.hourlyRateAvg) /
        (month.days + 1)
    };
    const newYear: ConstructionSiteYearly = {
      months: year.months,
      totalWorkHours: year.totalWorkHours + newDay.totalWorkHours,
      hourlyRateAvg:
        (year.hourlyRateAvg * year.months + newDay.hourlyRateAvg) / year.months
    };
    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(new Date().getFullYear().toString())
      .collection('month')
      .doc((new Date().getMonth() + 1).toString())
      .collection('day')
      .doc(new Date().getDate().toString())
      .set(newDay);

    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(new Date().getFullYear().toString())
      .collection('month')
      .doc((new Date().getMonth() + 1).toString())
      .set(newMonth);

    this.db
      .collection('constructionSites')
      .doc(constructionSite.id)
      .collection('year')
      .doc(new Date().getFullYear().toString())
      .set(newYear);
  }

  updateDay(constructionSite: ConstructionSite, newDay: ConstructionSiteDaily, year: ConstructionSiteYearly,
            month: ConstructionSiteMonthly, day: ConstructionSiteDaily, workerRemovedFromDb: boolean) {

      let newDaylyAvg;
      let newMonthlyAvg;
      let newYearlyAvg;

      if (workerRemovedFromDb) {

      newDaylyAvg = ((((constructionSite.listOfWorkers.length + 1) * day.hourlyRateAvg) -
      newDay.hourlyRateAvg) / constructionSite.listOfWorkers.length);
      newMonthlyAvg = ((month.HourlyRateAvg * month.days) - day.hourlyRateAvg + newDaylyAvg) / (month.days);
      newYearlyAvg = ((year.hourlyRateAvg * year.months) - month.HourlyRateAvg + newMonthlyAvg) / (year.months);

      day = {
        totalWorkHours: day.totalWorkHours + newDay.totalWorkHours,
        hourlyRateAvg: newDaylyAvg
        // + 1 na lenght zato sto se u metodi za otklanjanje workera lenght smanjuje pa +1 ide da dobijemo stari length
      };
      month = {
        days: month.days,
        totalWorkHours: month.totalWorkHours + newDay.totalWorkHours,
        HourlyRateAvg: newMonthlyAvg
      };
      year = {
        months: year.months,
        totalWorkHours: year.totalWorkHours + newDay.totalWorkHours,
        hourlyRateAvg: newYearlyAvg
      };
    } else {
       newDaylyAvg = ((((constructionSite.listOfWorkers.length - 1 ) * day.hourlyRateAvg) +
       newDay.hourlyRateAvg) / constructionSite.listOfWorkers.length);
       newMonthlyAvg = ((month.HourlyRateAvg * month.days) - day.hourlyRateAvg + newDaylyAvg) / month.days;
       newYearlyAvg = ((year.hourlyRateAvg * year.months) - month.HourlyRateAvg + newMonthlyAvg) / (year.months);

       day = {
        totalWorkHours: day.totalWorkHours + newDay.totalWorkHours,
        hourlyRateAvg: newDaylyAvg
      };
       month = {
       days: month.days,
       totalWorkHours: month.totalWorkHours + newDay.totalWorkHours,
       HourlyRateAvg: newMonthlyAvg
     };
       year = {
        months: year.months,
        totalWorkHours: year.totalWorkHours + newDay.totalWorkHours,
        hourlyRateAvg: newYearlyAvg
      };
    }
      console.log(day, month, year);


      this.db.collection('constructionSites').doc(constructionSite.id)
      .collection('year').doc((new Date()).getFullYear().toString()).
      collection('month').doc(((new Date()).getMonth() + 1).toString())
      .collection('day').doc(((new Date()).getDate()).toString()).set(day);

      this.db.collection('constructionSites').doc(constructionSite.id)
      .collection('year').doc((new Date()).getFullYear().toString())
      .collection('month') .doc(((new Date()).getMonth() + 1).toString()).set(month);

      this.db.collection('constructionSites').doc(constructionSite.id)
      .collection('year').doc((new Date()).getFullYear().toString()).set(year);

  }

  workerHours(
    worker: Worker,
    workHours: number,
    constructionSite: ConstructionSite
  ) {
    const date: Date = new Date();

    const newDay: ConstructionSiteDaily = {
      totalWorkHours: workHours,
      hourlyRateAvg: worker.hourlyRate
    };

    const docref = this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .collection('day')
      .doc(date.getDate().toString());

    const docRefMonth = this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString());

    const docRefYear = this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString());

    docRefYear.get().subscribe(doc => {
      const year: WorkerDetailsByDate = doc.data() as WorkerDetailsByDate;
      console.log('year is ', year);
      docRefMonth.get().subscribe(doc1 => {
        const month: WorkerDetailsByDate = doc1.data() as WorkerDetailsByDate;
        docref.get().subscribe(doc2 => {
          const day: WorkerDetailsByDate = doc2.data() as WorkerDetailsByDate;
          switch (isUndefined(year)) {
            case true:
              this.addYearWorker(worker, newDay, constructionSite);
              break;
            default:
              switch (isUndefined(month)) {
                case true:
                  this.addMonthWorker(worker, constructionSite, newDay, year);
                  break;
                default:
                  switch (isUndefined(day)) {
                    case true:
                      this.addDayWorker(
                        worker,
                        constructionSite,
                        newDay,
                        year,
                        month
                      );
                      break;
                    default:
                      this.updateDayWorker(
                        worker,
                        constructionSite,
                        newDay,
                        year,
                        month,
                        day
                      );
                      break;
                  }
                  break;
              }
          }
          this.sendConstructionSiteToDB(constructionSite);
          this.db
            .collection('workers')
            .doc(worker.id)
            .set(worker);
        });
      });
    });
  }
  updateDayWorker(worker: Worker, constructionSite: ConstructionSite, newDay: ConstructionSiteDaily,
                  year: WorkerDetailsByDate, month: WorkerDetailsByDate, day: WorkerDetailsByDate) {
                    // slucaj da radnik u jednom danu radi na dva razlicita  gradilista:
                    // proverava da li je constructionSiteName u dayu radnika je razlicit od
                    // gradilista na kom se sad unose radni sati, vrsi se konkatenacija na constructionSiteName
                    // u tom slucaju se ne oduzimaju za day vrednosti vec samo sabiraju za newDay
    const date = new Date();
    if (day.constructionSiteName !== constructionSite.name) {
      year = {
        totalWorkHours: year.totalWorkHours + newDay.totalWorkHours,
        hourlyRate: worker.hourlyRate,
        constructionSiteName: constructionSite.name,
        totalSalary:
          year.totalSalary + newDay.totalWorkHours * newDay.hourlyRateAvg,
        constructionSiteId: constructionSite.id
      };
      month = {
        totalWorkHours: month.totalWorkHours + newDay.totalWorkHours,
        hourlyRate: worker.hourlyRate,
        constructionSiteName: constructionSite.name,
        totalSalary:
          month.totalSalary + newDay.totalWorkHours * newDay.hourlyRateAvg,
        constructionSiteId: constructionSite.id
      };
      day = {
        totalWorkHours: newDay.totalWorkHours + day.totalWorkHours,
        hourlyRate: worker.hourlyRate,
        // constructionSiteName: day.constructionSiteName + ':'+ day.totalWorkHours + constructionSite.name + ':'+ newDay.totalWorkHours,
        constructionSiteName: constructionSite.name,
        totalSalary: newDay.totalWorkHours * newDay.hourlyRateAvg,
        constructionSiteId: constructionSite.id
      };
    } else {
      year = {
        totalWorkHours:
          year.totalWorkHours + newDay.totalWorkHours - day.totalWorkHours,
        hourlyRate: worker.hourlyRate,
        constructionSiteName: constructionSite.name,
        totalSalary:
          year.totalSalary +
          newDay.totalWorkHours * newDay.hourlyRateAvg -
          day.totalSalary,
        constructionSiteId: constructionSite.id
      };
      month = {
        totalWorkHours:
          month.totalWorkHours - day.totalWorkHours + newDay.totalWorkHours,
        hourlyRate: worker.hourlyRate,
        constructionSiteName: constructionSite.name,
        totalSalary:
          month.totalSalary +
          newDay.totalWorkHours * newDay.hourlyRateAvg -
          day.totalSalary,
        constructionSiteId: constructionSite.id
      };
      day = {
        totalWorkHours: newDay.totalWorkHours,
        hourlyRate: worker.hourlyRate,
        constructionSiteName: constructionSite.name,
        totalSalary: newDay.totalWorkHours * newDay.hourlyRateAvg,
        constructionSiteId: constructionSite.id
      };
    }

    this.db.collection('workers').doc(worker.id)
      .collection('year').doc(date.getFullYear().toString())
      .collection('month').doc((date.getMonth() + 1).toString())
      .collection('day').doc((date.getDate()).toString()).set(day);

    this.db.collection('workers').doc(worker.id)
      .collection('year').doc(date.getFullYear().toString())
      .collection('month').doc((date.getMonth() + 1).toString()).set(month);

    const docRefYear = this.db.collection('workers').doc(worker.id)
      .collection('year').doc(date.getFullYear().toString()).set(year);
  }
  addDayWorker(
    worker: Worker,
    constructionSite: ConstructionSite,
    newDay: ConstructionSiteDaily,
    year: WorkerDetailsByDate,
    month: WorkerDetailsByDate
  ) {
    const date = new Date();
    year = {
      totalWorkHours: year.totalWorkHours + newDay.totalWorkHours,
      hourlyRate: worker.hourlyRate,
      constructionSiteName: constructionSite.name,
      totalSalary:
        year.totalSalary + newDay.totalWorkHours * newDay.hourlyRateAvg,
      constructionSiteId: constructionSite.id
    };
    month = {
      totalWorkHours: month.totalWorkHours + newDay.totalWorkHours,
      hourlyRate: worker.hourlyRate,
      constructionSiteName: constructionSite.name,
      totalSalary:
        month.totalSalary + newDay.totalWorkHours * newDay.hourlyRateAvg,
      constructionSiteId: constructionSite.id
    };
    const day: WorkerDetailsByDate = {
      totalWorkHours: newDay.totalWorkHours,
      hourlyRate: worker.hourlyRate,
      constructionSiteName: constructionSite.name,
      totalSalary: newDay.totalWorkHours * newDay.hourlyRateAvg,
      constructionSiteId: constructionSite.id
    };
    this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .collection('day')
      .doc(date.getDate().toString())
      .set(day);

    this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .set(month);

    const docRefYear = this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .set(year);
  }

  addYearWorker(
    worker: Worker,
    newDay: ConstructionSiteDaily,
    constructionSite: ConstructionSite
  ) {
    const date: Date = new Date();
    const workerYearly: WorkerDetailsByDate = {
      totalWorkHours: newDay.totalWorkHours,
      hourlyRate: worker.hourlyRate,
      constructionSiteName: constructionSite.name,
      totalSalary: newDay.hourlyRateAvg * newDay.totalWorkHours,
      constructionSiteId: constructionSite.id
    };

    this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .collection('day')
      .doc(date.getDate().toString())
      .set(workerYearly);

    this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .set(workerYearly);

    const docRefYear = this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .set(workerYearly);
  }

  addMonthWorker(
    worker: Worker,
    constructionSite: ConstructionSite,
    newDay: ConstructionSiteDaily,
    year: WorkerDetailsByDate
  ) {
    // ovde moramo da razmislimo za total salary

    const date = new Date();
    year = {
      totalWorkHours: year.totalWorkHours + newDay.totalWorkHours,
      hourlyRate: worker.hourlyRate,
      constructionSiteName: constructionSite.name,
      totalSalary:
        year.totalSalary + newDay.totalWorkHours * newDay.hourlyRateAvg,
      constructionSiteId: constructionSite.id
    };
    const month: WorkerDetailsByDate = {
      totalWorkHours: newDay.totalWorkHours,
      hourlyRate: worker.hourlyRate,
      constructionSiteName: constructionSite.name,
      totalSalary: newDay.totalWorkHours * newDay.hourlyRateAvg,
      constructionSiteId: constructionSite.id
    };

    this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .collection('day')
      .doc(date.getDate().toString())
      .set(month);

    this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .collection('month')
      .doc((date.getMonth() + 1).toString())
      .set(month);

    const docRefYear = this.db
      .collection('workers')
      .doc(worker.id)
      .collection('year')
      .doc(date.getFullYear().toString())
      .set(year);
  }

  categoryCostsTimestampToDate(categoryCosts: any[]) {
    const newCategoryCosts: CategoryCost[] = [];
    categoryCosts.forEach(categoryCost => {
      const newCategoryCost: CategoryCost = {
        amount: categoryCost.amount,
        date: new Date(categoryCost.date.seconds * 1000),
        categoryId: categoryCost.categoryId,
        operatorId: categoryCost.operatorId,
        operatorName: categoryCost.operatorName,
        operatorSurname: categoryCost.operatorSurname
      };
      newCategoryCosts.push(newCategoryCost);
    });
    return newCategoryCosts;
  }

  listOfWorkersTimestampToDate(listOfWorkers: any[]) {
    const newListOfWorkers: { worker: Worker; workHours: number }[] = [];
    listOfWorkers.forEach(workerAndWorkHours => {
      const newWorker: Worker = {
        id: workerAndWorkHours.worker.id,
        name: workerAndWorkHours.worker.name,
        surname: workerAndWorkHours.worker.surname,
        address: workerAndWorkHours.worker.address,
        phone: workerAndWorkHours.worker.phone,
        totalWorkHours: workerAndWorkHours.worker.totalWorkHours,
        medicalExamDate: this.timestampToDate(
          workerAndWorkHours.worker.medicalExamDate
        ),
        medicalExamExpirationDate: this.timestampToDate(
          workerAndWorkHours.worker.medicalExamExpirationDate
        ),
        contractDate: this.timestampToDate(
          workerAndWorkHours.worker.contractDate
        ),
        contractExpirationDate: this.timestampToDate(
          workerAndWorkHours.worker.contractExpirationDate
        ),
        totalSalary: workerAndWorkHours.worker.totalSalary,
        totalDebt: workerAndWorkHours.worker.totalDebt,
        status: workerAndWorkHours.worker.status,
        hourlyRateDate: workerAndWorkHours.worker.hourlyRateDate,
        lastTwoHourlyRates: workerAndWorkHours.worker.lastTwoHourlyRates,
        // nad lastTwoHourlyRates nije odradjen convert iz timestampa u date
        hourlyRate: workerAndWorkHours.worker.hourlyRate,
        delegatedForDate: this.timestampToDate(
          workerAndWorkHours.worker.delegatedForDate
        )
      };
      newListOfWorkers.push({
        worker: newWorker,
        workHours: workerAndWorkHours.workHours
      });
    });
    console.log(
      'posle listOfWorkersTimestampToDate newListOfWorkers:',
      newListOfWorkers
    );
    return newListOfWorkers;
  }

  timestampToDate(timestamp: any) {
    if (
      timestamp === undefined ||
      timestamp === null ||
      timestamp.seconds === undefined
    ) {
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

  addEarnedToWorker(worker: Worker, constructionSite: ConstructionSite, workHours: number) {
    const earningRef = this.db.collection('workers').doc(worker.id)
    .collection('paymentsByConstructionSite').doc(constructionSite.id);

    earningRef.get().subscribe(doc => {
      let earning: EarnedOnConstructionSite = doc.data() as EarnedOnConstructionSite;
      if (isUndefined(earning)) {
        const newEarning: EarnedOnConstructionSite = {
          id: constructionSite.id,
          totalEarned: worker.hourlyRate * workHours,
          ConstructionSiteName: constructionSite.name
        };
        earningRef.set(newEarning);
      } else {
        // ovde treba da ispita da li se menja earning ili dodaje
        earning = {
          id: earning.id,
          totalEarned: earning.totalEarned + (worker.hourlyRate * workHours),
          ConstructionSiteName: earning.ConstructionSiteName
        };
        earningRef.set(earning);
      }
    });
  }
}
