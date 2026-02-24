import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaskTimeDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actualHours: number;
}
