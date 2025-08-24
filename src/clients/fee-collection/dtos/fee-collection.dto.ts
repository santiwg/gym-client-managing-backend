import { IsDate, IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator";
import { IsNotFutureDate } from "src/shared/validators/is-not-future-date.validator";

export class FeeCollectionDto {
  @IsDate()
  @IsNotFutureDate()
  @IsOptional()
  date?: Date;

  //historicalUnitAmount se asigna en el servicio de creación de FeeCollection
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  paidMonths: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  clientDocumentNumber: string;
}
