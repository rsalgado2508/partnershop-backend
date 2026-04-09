import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EstadoNovedad } from '../../../common/enums';

export class UpdateEstadoNovedadDto {
  @ApiProperty({
    description: 'Nuevo estado de la novedad',
    enum: EstadoNovedad,
  })
  @IsNotEmpty()
  @IsEnum(EstadoNovedad)
  estado: EstadoNovedad;

  @ApiPropertyOptional({ description: 'Detalle del cambio de estado' })
  @IsOptional()
  @IsString()
  detalle?: string;
}
