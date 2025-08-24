import { IsNotEmpty, IsString } from "class-validator";

export class AttendanceDto {
  dateTime?: Date;

  //con el client obtengo la suscripción
  @IsString()
  @IsNotEmpty()
  clientDocumentNumber: string;
}
