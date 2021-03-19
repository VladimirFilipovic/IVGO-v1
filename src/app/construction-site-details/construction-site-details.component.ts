import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, Form } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConstructionSiteService } from '../services/construction-site.service';
import { Subscription } from 'rxjs';
import { ConstructionSite } from '../models/construction-site';
import { WorkerService } from '../services/worker.service';
import { Worker } from '../models/worker';
import { Category } from '../models/category';
import { CategoryCost } from '../models/category-cost';
import { AngularFirestore } from '@angular/fire/firestore';
import { HourlyRate } from '../models/hourly-rate';
import { isUndefined, isNull } from 'util';

@Component({
  selector: 'app-construction-site-details',
  templateUrl: './construction-site-details.component.html',
  styleUrls: ['./construction-site-details.component.css']
})
export class ConstructionSiteDetailsComponent implements OnInit, OnDestroy {
  workHoursForm: FormGroup;

  constructor(private route: ActivatedRoute,  public constructionSiteService: ConstructionSiteService,
              public workerService: WorkerService, private db: AngularFirestore) { }

  newCategoryForm: FormGroup;
  newCategoryCostForm: FormGroup;

  private constructionSiteSub: Subscription;
  private listOfAllWorkersSub: Subscription;
  constructionSite: ConstructionSite;
  workersAndTheirHours: {worker: Worker, workHours: number}[] = [] ;
  workersSub: Subscription;
  listOfAllWorkers: Worker[] = [];
  categories: Category[] = [];

  workerHours: any = [];

  ngOnInit() {
    this.newCategoryForm = new FormGroup({
      name: new FormControl(null, { validators: [Validators.required, Validators.minLength(1)] })
    });
    this.newCategoryCostForm = new FormGroup({
      amount: new FormControl(null, { validators: [Validators.required] })
    });
    this.workHoursForm = new FormGroup({
      workHours: new FormControl(null, { validators: [Validators.required] })
    });
    const id = this.route.snapshot.paramMap.get('id');
    console.log(id);
    this.constructionSiteService.getConstructionSiteFromDB(id);
    this.constructionSiteSub = this.constructionSiteService.getConstructionSiteUpdateListener()
    .subscribe((data: ConstructionSite) => {
      this.constructionSite = data;
      console.log('construction site', this.constructionSite);
      console.log(this.constructionSite.hourlyRateAvg);

      const today = new Date();
      console.log('ngOnInit(): getConstructionSiteFromDB(): constructionSite.listOfWorkers: ', this.constructionSite.listOfWorkers);
      this.workersAndTheirHours = this.constructionSite.listOfWorkers.filter(wh => {
        return (wh.worker.delegatedForDate.getDate() === today.getDate() &&
        wh.worker.delegatedForDate.getMonth() === today.getMonth() &&
        wh.worker.delegatedForDate.getFullYear() === today.getFullYear());
      });
      console.log('workersAndTheirHours u ngOnInitu:', this.workersAndTheirHours);
      // this.workerHours = this.workerService.g  etWorkerHours(this.workers);
      // console.log('component: ', this.workerHours);

      // this.workerService.getWorkerHoursUpdateListener().subscribe(workerHours => {
      //   this.workerHours = workerHours;
      // });
    });
    this.constructionSiteService.getCategories(id);
    this.constructionSiteService.getCategoriesUpdateListener().subscribe(categories => {
      this.categories = categories;
    });

    this.getListOfWorkers();

  }

  getListOfWorkers() {
    this.workerService.getWorkersFromDB();
    this.listOfAllWorkersSub = this.workerService.getWorkersUpdateListener()
    .subscribe((workers: Worker[]) => {

      const today = new Date();
      this.listOfAllWorkers = workers.filter(w => {
       // console.log('w.delegatedForDate: ' + w.delegatedForDate);
        return w.delegatedForDate.getDate() !== today.getDate() ||
        w.delegatedForDate.getMonth() !== today.getMonth() ||
        w.delegatedForDate.getFullYear() !== today.getFullYear();
      });
    });

  }

  // promenio sam umesto na index da bude push
  addWorkerToConstructionSite(worker: Worker) {
    const index = this.constructionSite.listOfWorkers.length;
    this.workerService.updateWorkerDelegationForDate(worker);
    this.constructionSite.listOfWorkers.push({worker, workHours: 0});
    this.workersAndTheirHours.push({worker, workHours: 0});
    // this.workers.push(worker);
    this.constructionSite.hourlyRateAvg = ((this.constructionSite.hourlyRateAvg * index) + worker.hourlyRate) / (index + 1);
    this.constructionSiteService.updateConstructionSite(this.constructionSite);

    this.constructionSiteService.addWorkHours(worker, this.constructionSite, 0 , false);

    // this.workerService.updateWorkerDelegationForDate(worker);

  }

  addCategory() {
    let categoryAlreadyExists = false;
    let j;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.categories.length; i++) {
      if (this.categories[i].categoryName.toLowerCase().includes(this.newCategoryForm.value.name.toLowerCase())) {
        categoryAlreadyExists = true;
        j = i;
        break;
      }
    }

    if (categoryAlreadyExists) {
      alert('Kategorija vec postoji');
    } else {

      const newCategory: Category = {
      id : this.constructionSiteService.generateID(),
      constructionSiteID: this.constructionSite.id,
      categoryName: this.newCategoryForm.value.name,
      totalCost: 0,
      categoryCosts: []
    };
      this.constructionSiteService.addCategory(this.constructionSite.id, newCategory);
    }
  }

  addNewCategoryCost(category: Category, form: NgForm) {
    // hardcodovacemo operatora
    const newCategoryCost: CategoryCost = {
      amount: form.value.cost,
      date: new Date(),
      categoryId: category.id,
      operatorId: 'Vasa',
      operatorName: 'Vasilije',
      operatorSurname: 'Jovanovic'
    };
    this.constructionSiteService.addCategoryCost(this.constructionSite, newCategoryCost, category);
  }

  addWorkHours(worker: Worker, oldWorkHours: number, form: NgForm) {
    const index = this.constructionSite.listOfWorkers.findIndex(v =>
      v.worker === worker
    );
    console.log("workers and their hours", this.workersAndTheirHours);
    this.constructionSite.listOfWorkers[index].workHours = form.value.workHours;
    this.workersAndTheirHours[index].workHours = form.value.workHours;
    console.log('Work hour dodat u niz u constructionsite-u:' + this.constructionSite.listOfWorkers[index].workHours);

    if (oldWorkHours !== 0) {
      // this.workerService.getWorkerFromDB(worker.id);
      // this.workersSub = this.workerService.getWorkerUpdateListener().subscribe(workerFromDb => {
      //   worker = workerFromDb as Worker;
      //   alert(JSON.stringify(worker));

      //   this.constructionSiteService.addWorkHours(worker, this.constructionSite, form.value.workHours, false);
      // });
      this.constructionSite.totalWorkHours -= oldWorkHours;
      worker.totalWorkHours -= oldWorkHours;
    }

    this.constructionSiteService.addWorkHours(worker, this.constructionSite, form.value.workHours, false);
  }

  /**
   * Removes the `worker` from `constructionSite.workers[]` and subtracts his `workHours` and `hourlyRate` from the construction site
   * @param worker - Will be removed from `constructionSite`
   * @param workHoursForm - Provides `workHours` via `workHoursForm.value.workHours`
   */
  removeWorkerAndHisHoursFromConstructionSite(worker: Worker, workHoursForm: NgForm) {
    console.log('this.workers.length: pre remova: ', this.workersAndTheirHours.length);
    const length = this.constructionSite.listOfWorkers.length;
    this.constructionSite.listOfWorkers = this.constructionSite.listOfWorkers.filter(w => {
      return w.worker.id !== worker.id;
    });
    this.constructionSite.hourlyRateAvg = ((this.constructionSite.hourlyRateAvg * length) - worker.hourlyRate) / (length - 1);
    this.constructionSite.totalWorkHours -= workHoursForm.value.workHours;
    this.constructionSiteService.updateConstructionSite(this.constructionSite);
    this.constructionSiteService.addWorkHours(worker, this.constructionSite, 0 , true);
    worker.delegatedForDate = new Date(0);
    this.workerService.setWorkerDelegatedDateToUndelegated(worker);
    this.constructionSiteService.getConstructionSiteFromDB(this.constructionSite.id);
    this.workersAndTheirHours = this.workersAndTheirHours.filter(w => {
      return w.worker.id !== worker.id;
    });
    console.log('this.workers.length: posle remova: ', this.workersAndTheirHours.length);
  }

  // ovde treba preracunati prosek gradilistanakon otklanjanja workera
  removeWorkerAndKeepHisHoursFromConstructionSite(worker: Worker) {
    console.log('this.workers.length: pre remova: ', this.workersAndTheirHours.length);
    const length = this.constructionSite.listOfWorkers.length;
    this.constructionSite.listOfWorkers = this.constructionSite.listOfWorkers.filter(w => {
      return w.worker.id !== worker.id;
    });
    // this.constructionSite.hourlyRateAvg = ((this.constructionSite.hourlyRateAvg * length) - worker.hourlyRate) / (length - 1);
    this.constructionSiteService.updateConstructionSite(this.constructionSite);
    // this.constructionSiteService.addWorkHours(worker, this.constructionSite, 0 , false);
    worker.delegatedForDate = new Date(0);
    this.workerService.setWorkerDelegatedDateToUndelegated(worker);
    this.constructionSiteService.getConstructionSiteFromDB(this.constructionSite.id);
    this.workersAndTheirHours = this.workersAndTheirHours.filter(w => {
      return w.worker.id !== worker.id;
    });
    console.log('this.workers.length: posle remova: ', this.workersAndTheirHours.length);
  }

  getHoursFromWorkerHours(worker: Worker) {
    // this.workerHours.find(w => w.id === worker.id);
    console.log('workerHours.length: ', this.workerHours.length);
    this.workerHours.forEach(w => {
      console.log('w.workerId = ' + w.workerId + ', worker.id = ' + worker.id);
      if (w.workerId === worker.id) {
        console.log('work hours', w.workerHours);
        return w.workerHours;
      }
    });
  }

  sameAsYesterday() {
    // prolazi se kroz listOfAllWorkers gradilista i menja radnih sati
    // u bazi svakom radniku nov delegeted date
    console.log('sameAsYesterday(): clicked!');
    this.constructionSiteService.sameAsYesterday(this.constructionSite);
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

  ngOnDestroy(): void {
    // this.constructionSiteSub.unsubscribe();
    // if (!isUndefined(this.workersSub)) {
    //   this.workersSub.unsubscribe();
    // }

  }

}
