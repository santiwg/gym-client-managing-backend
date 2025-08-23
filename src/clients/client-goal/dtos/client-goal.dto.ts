import { IsNotEmpty, IsString } from "class-validator";

export class ClientGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  description?: string;
}
