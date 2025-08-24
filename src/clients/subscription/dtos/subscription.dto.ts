import { IsDate, IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator";
import { IsNotFutureDate } from "src/shared/validators/is-not-future-date.validator";

export class SubscriptionDto {
  
  @IsDate()
  @IsOptional()
  @IsNotFutureDate()
  startDate?: Date;
  
  //El state se asigna al crear

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  membershipId: number;

  //clientId se pasa en la ruta
}
