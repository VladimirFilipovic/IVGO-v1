import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ivGO';

  workers: Observable<any[]>;
  constructor(private db: AngularFirestore) {
    // this.workers = db.collection('workers').valueChanges();
    // this.workers = db.collection('workers').doc('id radnika').collection('payments').valueChanges();
  }

  getWorkers() {
    // this.db.collection('workers').doc
  }

  addWorker() {
    // this.db.collection('workers').add({
    //   name: 'ime3',
    //   surname: 'prezime3'
    // });
  }
}
