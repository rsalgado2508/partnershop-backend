import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class FilterSeguimientoDiarioDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial del rango a consultar',
    example: '2026-01-22',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del rango a consultar',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por plataforma antes de consolidar por fecha',
    example: 'shopify',
  })
  @IsOptional()
  @IsString()
  plataforma?: string;
}
