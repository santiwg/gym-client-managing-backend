
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
export class NewUnitDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsString()
  scope: string;
}