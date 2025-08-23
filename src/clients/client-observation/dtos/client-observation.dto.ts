import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsNotFutureDate } from "src/shared/validators/is-not-future-date.validator";

export class ClientObservationDto {
  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsDate()
  @IsNotFutureDate()
  @IsOptional() 
  date?: Date;
  //clientId no, se asigna automaticamente porque las creamos juntas
}
