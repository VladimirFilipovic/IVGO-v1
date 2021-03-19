import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as firebase from 'firebase';

import { Worker } from 'src/app/models/worker';
import { HourlyRate } from 'src/app/models/hourly-rate';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { WorkerService } from '../services/worker.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-new-worker',
  templateUrl: './new-worker.component.html',
  styleUrls: ['./new-worker.component.css']
})
export class NewWorkerComponent implements OnInit {

  addWorkerForm: FormGroup;

  constructor(
    public activatedRoute: ActivatedRoute,
    public workerService: WorkerService,
    private snackBar: MatSnackBar,
    private router: Router) { }
  lastHourlyRates: HourlyRate[];
  mode = 'create';
  editID: string;
  workerr: Worker;
  private workerSub: Subscription;

  ngOnInit() {
    this.addWorkerForm = new FormGroup({
      name: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      surname: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      address: new FormControl(null, { validators: [Validators.minLength(3)] }),
      phone: new FormControl(null, { validators: [Validators.minLength(9)] }),
      medicalExamDate: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      medicalExamExpirationDate: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      contractDate: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      contractExpirationDate: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      hourlyRate: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] })
    });
    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        console.log('mode edit');
        this.mode = 'edit';
        this.editID = paramMap.get('id');
        this.workerService.getWorkerFromDB(this.editID);
        this.workerSub = this.workerService.getWorkerUpdateListener()
        .subscribe((data: Worker) => {
          this.workerr = data;
          this.addWorkerForm.setValue({
          name: this.workerr.name,
          surname: this.workerr.surname,
          address: this.workerr.address,
          phone: this.workerr.phone,
          medicalExamDate: this.workerr.medicalExamDate,
          medicalExamExpirationDate: this.workerr.medicalExamExpirationDate,
          contractDate: this.workerr.contractDate,
          contractExpirationDate: this.workerr.contractExpirationDate,
          hourlyRate: this.workerr.hourlyRate
        });
        });
        // this.addWorkerForm.setValue({
        //     name: this.workerr.name,
        //     surname: this.workerr.surname,
        //     address: this.workerr.address,
        //     phone: this.workerr.address,
        //     medicalExamDate: this.workerr.medicalExamDate,
        //     medicalExamExpirationDate: this.workerr.medicalExamExpirationDate,
        //     contractDate: this.workerr.contractDate,
        //     contractExpirationDate: this.workerr.contractExpirationDate,
        //     hourlyRate: this.workerr.hourlyRate
        //   });
      } else {
        this.mode = 'create';
      }
    });
  }


  sendWorkerToDB() {
    let hourlyRate1: HourlyRate;
    let salaryChanged: boolean;
    if ( this.mode === 'create') {
      this.lastHourlyRates = [];
      const dbID = this.workerService.generateID();
      console.log('this.addWorkerForm.get(medicalExamDate).value: ', this.addWorkerForm.get('medicalExamDate').value);
      const newWorker: Worker = {
        id: dbID,
        name: this.addWorkerForm.get('name').value,
        surname: this.addWorkerForm.get('surname').value,
        address: this.addWorkerForm.get('address').value,
        phone: this.addWorkerForm.get('phone').value,
        totalWorkHours: 0,
        medicalExamDate: new Date(this.addWorkerForm.get('medicalExamDate').value),
        medicalExamExpirationDate: new Date(this.addWorkerForm.get('medicalExamExpirationDate').value),
        contractDate: new Date(this.addWorkerForm.get('contractDate').value),
        contractExpirationDate: new Date(this.addWorkerForm.get('contractExpirationDate').value),
        totalSalary: 0,
        totalDebt: 0,
        status: true,
        hourlyRateDate: new Date(),
        lastTwoHourlyRates: this.lastHourlyRates,
        hourlyRate: this.addWorkerForm.get('hourlyRate').value,
        delegatedForDate: new Date(0)
      };
      // zasto opet pravimo id??????????
      // const id = this.db.createId();
      hourlyRate1 = {workerId: dbID,
                                     ammount: newWorker.hourlyRate,
                                     date: newWorker.hourlyRateDate};
      this.workerService.sendWorkerToDB(newWorker, hourlyRate1);
      // this.db.collection('workers').doc(id).set(newWorker);
      // this.db.collection('workers').doc(id).collection('HourlyRates').add(hourlyRate1);
      const update: HourlyRate[] = [];
      update[0] = hourlyRate1;
    } else {
      this.workerr.name = this.addWorkerForm.value.name;
      this.workerr.surname = this.addWorkerForm.value.surname;
      this.workerr.address = this.addWorkerForm.value.address;
      this.workerr.phone = this.addWorkerForm.value.phone;
      this.workerr.name = this.addWorkerForm.value.name;
      this.workerr.medicalExamDate = this.addWorkerForm.value.medicalExamDate;
      this.workerr.medicalExamExpirationDate = this.addWorkerForm.value.medicalExamExpirationDate;
      this.workerr.contractDate = this.addWorkerForm.value.contractDate;
      this.workerr.contractExpirationDate = this.addWorkerForm.value.contractExpirationDate;
      if (this.workerr.hourlyRate !== this.addWorkerForm.value.hourlyRate) {
        salaryChanged = true;
        const newListOfLastTwoHourlyRates: HourlyRate[] = [];
        const newHourlyRate: HourlyRate = { workerId: this.workerr.id,
                                            ammount: this.workerr.hourlyRate,
                                           date: this.workerr.hourlyRateDate};
        if (this.workerr.lastTwoHourlyRates.length > 1) {
          newListOfLastTwoHourlyRates[0] = this.workerr.lastTwoHourlyRates[1];
          newListOfLastTwoHourlyRates[1] = newHourlyRate;
          this.workerr.lastTwoHourlyRates = newListOfLastTwoHourlyRates;
        } else if (this.workerr.lastTwoHourlyRates.length === 1) {
          this.workerr.lastTwoHourlyRates[1] = newHourlyRate;
        } else {
          this.workerr.lastTwoHourlyRates[0] = newHourlyRate;
        }
        this.workerr.hourlyRate = this.addWorkerForm.value.hourlyRate;
        this.workerr.hourlyRateDate = new Date();

      }

      hourlyRate1 = { workerId: this.workerr.id,
        ammount: this.workerr.hourlyRate,
       date: this.workerr.hourlyRateDate};
      console.log('this.workerr.id: ', this.workerr.id);

      this.workerService.updateWorker(this.workerr, hourlyRate1, salaryChanged);
    }
    // this.db.collection('workers').doc(id).update({lastHourlyRates: update});
    this.snackBar.open(this.addWorkerForm.value.name + ' ' + this.addWorkerForm.value.surname,
      ((this.mode === 'create') ? 'Dodat!' : 'Izmenjen'), {
      duration: 2000,
    });
    // this.router.navigate(['/workers']);
  }

}

