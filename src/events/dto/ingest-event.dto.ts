import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class IngestEventDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;
}
