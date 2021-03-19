import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Payment } from '../models/payment';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Worker } from '../models/worker';
import { WorkerService } from '../services/worker.service';

@Component({
  selector: 'app-list-of-workers',
  templateUrl: './list-of-workers.component.html',
  styleUrls: ['./list-of-workers.component.css']
})
export class ListOfWorkersComponent implements OnInit {

  workers: Observable<Worker[]>;
  workersList: Worker[] = [];
  workersListFiltered = [] as Worker[];
  checked = false;

  payments: Observable<any[]>;

  workerNameFilterForm: FormGroup;

  private workersSub: Subscription;

  constructor(private db: AngularFirestore, public workersService: WorkerService) {}

  ngOnInit() {
    this.workersService.getWorkersFromDB();
    this.workersSub = this.workersService.getWorkersUpdateListener()
    .subscribe((workers: Worker[])  => {
      this.workersListFiltered = workers;
      this.workersList = workers;
      console.log(this.workersListFiltered);
      this.workersSub.unsubscribe();
    });

    this.workerNameFilterForm = new FormGroup({
      queryTerm: new FormControl(null)
    });
  }

  filter(queryTerm: string) {
    if (this.checked) {
      this.workersListFiltered = this.workersList.filter(item => (
        item.name.toLowerCase() + item.surname.toLowerCase()).includes(queryTerm.toLowerCase()));
    } else {
      this.workersListFiltered = this.workersList.filter(item => (
        item.name.toLowerCase() + item.surname.toLowerCase()).includes(queryTerm.toLowerCase()) &&
        item.status === true);
    }
  }

  allWorkersCheckedChange() {
    this.checked = !this.checked;
    // this.filter();
  }
}
