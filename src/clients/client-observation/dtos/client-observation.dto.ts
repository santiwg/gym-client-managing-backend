import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
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
  @Type(() => Date)
  date?: Date;
}
