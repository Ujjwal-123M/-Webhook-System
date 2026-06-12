import {
  IsUrl,
  IsArray,
  IsString,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsUrl({}, { message: 'targetUrl must be a valid URL' })
  targetUrl: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  eventTypes: string[];

  @IsOptional()
  @IsString()
  secret?: string;
}
