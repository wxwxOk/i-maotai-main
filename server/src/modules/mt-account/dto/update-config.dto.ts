import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  itemCodes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  shopType?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  reserveMinute?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  randomMinute?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  autoTravel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isEnabled?: number;
}
