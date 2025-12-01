import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateLocationDto {
  @IsNotEmpty({ message: '省份不能为空' })
  @IsString()
  provinceName: string;

  @IsNotEmpty({ message: '城市不能为空' })
  @IsString()
  cityName: string;

  @IsNotEmpty({ message: '纬度不能为空' })
  @IsString()
  lat: string;

  @IsNotEmpty({ message: '经度不能为空' })
  @IsString()
  lng: string;

  @IsOptional()
  @IsString()
  address?: string;
}
