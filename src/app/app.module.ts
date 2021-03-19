import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NewWorkerComponent } from './new-worker/new-worker.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import * as firebase from 'firebase';
import { ListOfWorkersComponent } from './list-of-workers/list-of-workers.component';
import { NavigationComponent } from './navigation/navigation.component';
import { WorkerDetailsComponent } from './worker-details/worker-details.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NewConstructionSiteComponent } from './new-construction-site/new-construction-site.component';
import { ListOfConstructionSitesComponent } from './list-of-construction-sites/list-of-construction-sites.component';
import { ConstructionSiteDetailsComponent } from './construction-site-details/construction-site-details.component';
import { NavigationTabsComponent } from './navigation/navigation-tabs/navigation-tabs.component';
import { HomeComponent } from './home/home.component';
import { MatTabsModule } from '@angular/material';


@NgModule({
  declarations: [
    AppComponent,
    NewWorkerComponent,
    ListOfWorkersComponent,
    NavigationComponent,
    WorkerDetailsComponent,
    NewConstructionSiteComponent,
    ListOfConstructionSitesComponent,
    ConstructionSiteDetailsComponent,
    NavigationTabsComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    MatTabsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence(),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
