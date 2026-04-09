import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

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
}
