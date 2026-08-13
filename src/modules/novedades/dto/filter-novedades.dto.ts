import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EstadoNovedad } from '../../../common/enums';

export class FilterNovedadesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de orden' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idOrden?: number;

  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idCategoria?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: EstadoNovedad,
  })
  @IsOptional()
  @IsEnum(EstadoNovedad)
  estado?: EstadoNovedad;
}
