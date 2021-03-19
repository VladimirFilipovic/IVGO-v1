import { CategoryCost } from './category-cost';

export interface Category {
    id: string;
    constructionSiteID: string;
    categoryName: string;
    totalCost: number;
    categoryCosts: CategoryCost[];

}
