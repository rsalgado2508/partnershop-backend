import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const RANGOS_FECHA_REPORTE = [
  'ultimos_7_dias',
  'entre_7_y_15_dias',
  'entre_15_y_20_dias',
  'mas_de_20_dias',
  'guias_mayor_a_2_dias',
] as const;

export type RangoFechaReporte = (typeof RANGOS_FECHA_REPORTE)[number];

export class FilterOrdenesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por estatus de la orden' })
  @IsOptional()
  @IsString()
  estatus?: string;

  @ApiPropertyOptional({
    description: 'Buscar por número de orden, guía o id de orden tienda',
  })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ description: 'Filtrar por plataforma' })
  @IsOptional()
  @IsString()
  plataforma?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de categoría de la última novedad',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCategoriaNovedad?: number;

  @ApiPropertyOptional({ description: 'Filtrar por nombre de transportadora' })
  @IsOptional()
  @IsString()
  transportadora?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicial de reporte en formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  fechaReporteDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final de reporte en formato YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  fechaReporteHasta?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar por rango de fecha de reporte o por guías mayores a 2 días',
    enum: RANGOS_FECHA_REPORTE,
  })
  @IsOptional()
  @IsString()
  @IsIn(RANGOS_FECHA_REPORTE)
  rangoFechaReporte?: RangoFechaReporte;
}
