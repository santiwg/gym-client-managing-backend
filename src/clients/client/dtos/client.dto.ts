import { IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Validate, ValidateNested } from "class-validator";
import { Client } from "../client.entity";
import { ClientObservation } from "src/clients/client-observation/observation.entity";
import { Type } from "class-transformer";
import { IsNotFutureDate } from "src/shared/validators/is-not-future-date.validator";
import { ClientObservationDto } from "src/clients/client-observation/dtos/client-observation.dto";

export class ClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @Min(1)
  @IsNumber()
  genderId: number;

  @IsNotEmpty()
  @Min(1)
  @IsNumber()
  bloodTypeId: number;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  
    
  @IsDate()
  @IsNotFutureDate()
  @IsOptional()
  registrationDate?: Date;

  
  @IsNumber()
  @Min(1)
  @IsOptional()
  clientGoalId?: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientObservationDto)
  @IsOptional()
  clientObservations?: ClientObservationDto[];
}
