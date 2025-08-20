export class ClientDto {
  name: string;
  lastName: string;
  genderId: number;
  bloodTypeId: number;
  documentNumber: string;
  email: string;
  phoneNumber?: string;
  registrationDate?: Date;
  clientGoalId?: number;
}
