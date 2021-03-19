import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ConstructionSiteService } from '../services/construction-site.service';
import { ConstructionSite } from '../models/construction-site';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-new-construction-site',
  templateUrl: './new-construction-site.component.html',
  styleUrls: ['./new-construction-site.component.css']
})
export class NewConstructionSiteComponent implements OnInit {

  newConstructionSiteForm: FormGroup;
  mode = 'create';
  editID: string;
  private constructionSiteSub: Subscription;
  private constructionSite: ConstructionSite;

  constructor(
    private router: Router,
    public activatedRoute: ActivatedRoute,
    public constructionSiteService: ConstructionSiteService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.newConstructionSiteForm = new FormGroup({
      name: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      address: new FormControl(null, { validators: [Validators.required, Validators.minLength(3)] }),
      openingDate: new FormControl(null, { validators: [Validators.required] })
    });

    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        this.mode = 'edit';
        this.editID = paramMap.get('id');
        this.constructionSiteService.getConstructionSiteFromDB(this.editID);
        this.constructionSiteSub = this.constructionSiteService.getConstructionSiteUpdateListener()
        .subscribe((data: ConstructionSite) => {
          this.constructionSite = data;
          this.newConstructionSiteForm.setValue({
            name: this.constructionSite.name,
            address: this.constructionSite.address,
            openingDate: this.constructionSite.openingDate
          });
        });
      } else {
        this.mode = 'create';
      }
    });
  }

  sendConstructionSiteToDB() {
    if (!this.newConstructionSiteForm.valid) {
      alert('los unos!');
      return;
    }
    if ( this.mode === 'create') {
      const dbID = this.constructionSiteService.generateID();
      const newConstructionSite: ConstructionSite = {
        id: dbID,
        name: this.newConstructionSiteForm.get('name').value,
        address: this.newConstructionSiteForm.get('address').value,
        active: true,
        openingDate: new Date(this.newConstructionSiteForm.get('openingDate').value),
        closingDate: new Date(0),
        totalSalaryGiven: 0,
        hourlyRateAvg: 0,
        totalWorkHours: 0,
        totalCostOfSubCategories: 0,
        listOfWorkers: []
      };
      this.constructionSiteService.sendConstructionSiteToDB(newConstructionSite);
    } else {
      this.constructionSite.name = this.newConstructionSiteForm.value.name;
      this.constructionSite.address = this.newConstructionSiteForm.value.address;
      this.constructionSite.openingDate = this.newConstructionSiteForm.value.openingDate;
      this.constructionSiteService.sendConstructionSiteToDB(this.constructionSite);
    }
    this.snackBar.open(this.newConstructionSiteForm.value.name, ((this.mode === 'create') ? 'Dodato!' : 'Izmenjeno'), {
      duration: 2000,
    });
    this.router.navigate(['/constructionSites']);
  }

}
