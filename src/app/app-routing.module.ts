import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListOfWorkersComponent } from './list-of-workers/list-of-workers.component';
import { NewWorkerComponent } from './new-worker/new-worker.component';
import { WorkerDetailsComponent } from './worker-details/worker-details.component';
import { NewConstructionSiteComponent } from './new-construction-site/new-construction-site.component';
import { ListOfConstructionSitesComponent } from './list-of-construction-sites/list-of-construction-sites.component';
import { ConstructionSiteDetailsComponent } from './construction-site-details/construction-site-details.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'workers', component: ListOfWorkersComponent},
  {path: 'newWorker', component: NewWorkerComponent},
  {path: 'workerDetails/:id', component: WorkerDetailsComponent},
  {path: 'editWorker/:id', component: NewWorkerComponent},
  {path: 'constructionSites', component: ListOfConstructionSitesComponent},
  {path: 'newConstructionSite', component: NewConstructionSiteComponent},
  {path: 'constructionSiteDetails/:id', component: ConstructionSiteDetailsComponent},
  {path: 'editConstructionSite/:id', component: NewConstructionSiteComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
