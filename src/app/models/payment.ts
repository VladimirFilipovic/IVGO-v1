export interface Payment {
  id: string;
  managersId: string;
  managersName: string;
  managersSurname: string;
  managersParentsName: string;
  amount: number;
  date: Date;
}
