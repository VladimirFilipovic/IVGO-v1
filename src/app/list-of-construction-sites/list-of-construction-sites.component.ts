import { Component, OnInit } from '@angular/core';
import { ConstructionSite } from '../models/construction-site';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ConstructionSiteService } from '../services/construction-site.service';

@Component({
  selector: 'app-list-of-construction-sites',
  templateUrl: './list-of-construction-sites.component.html',
  styleUrls: ['./list-of-construction-sites.component.css']
})
export class ListOfConstructionSitesComponent implements OnInit {

  constructionSitesList: ConstructionSite[] = [];
  constructionSitesListFiltered = [] as ConstructionSite[];
  checked = false;
  constructionSiteNameFilterForm: FormGroup;
  constructionSitesSub: Subscription;

  constructor(private constructionSiteService: ConstructionSiteService) { }

  ngOnInit() {
    this.constructionSiteNameFilterForm = new FormGroup({
      queryTerm: new FormControl(null)
    });
    this.constructionSiteService.getConstructionSites();
    this.constructionSitesSub = this.constructionSiteService.getConstructionSitesUpdateListener()
    .subscribe((constructionSites: ConstructionSite[]) => {
      // this.constructionSitesList = [] as ConstructionSite[];
      // this.constructionSitesList = constructionSites;
      // this.constructionSitesListFiltered = constructionSites;
      this.constructionSitesListFiltered = constructionSites;
      this.constructionSitesList = constructionSites;
      // this.constructionSitesList = [] as ConstructionSite[];
      this.constructionSitesSub.unsubscribe();
    });
  }

  filter(queryTerm: string) {
    if (this.checked) {
      this.constructionSitesListFiltered = this.constructionSitesList.filter(item => (
        item.name.toLowerCase()).includes(queryTerm.toLowerCase()));
    } else {
      this.constructionSitesListFiltered = this.constructionSitesList.filter(item => (
        item.name.toLowerCase()).includes(queryTerm.toLowerCase()) &&
        item.active === true);
    }
  }

  allConstructionSitesCheckedChange() {
    this.checked = !this.checked;
    // this.filter();
  }
}
