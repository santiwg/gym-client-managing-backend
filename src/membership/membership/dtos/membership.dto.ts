import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";

export class MembershipDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  monthlyPrice: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @Min(1)
  weeklyAttendanceLimit: number;
}