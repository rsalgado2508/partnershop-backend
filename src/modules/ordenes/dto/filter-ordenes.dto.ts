import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const RANGOS_FECHA_REPORTE = [
  'ultimos_7_dias',
  'entre_7_y_15_dias',
  'entre_15_y_20_dias',
  'mas_de_20_dias',
] as const;

export type RangoFechaReporte = (typeof RANGOS_FECHA_REPORTE)[number];

export class FilterOrdenesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por estatus de la orden' })
  @IsOptional()
  @IsString()
  estatus?: string;

  @ApiPropertyOptional({ description: 'Buscar por número de orden o guía' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ description: 'Filtrar por plataforma' })
  @IsOptional()
  @IsString()
  plataforma?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por rango de fecha de reporte',
    enum: RANGOS_FECHA_REPORTE,
  })
  @IsOptional()
  @IsString()
  @IsIn(RANGOS_FECHA_REPORTE)
  rangoFechaReporte?: RangoFechaReporte;
}
