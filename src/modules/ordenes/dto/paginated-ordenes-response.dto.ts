import { ApiProperty } from '@nestjs/swagger';
import { OrdenVentaResponseDto } from './orden-venta-response.dto';

export class PaginatedOrdenesResponseDto {
  @ApiProperty({ type: () => [OrdenVentaResponseDto] })
  data: OrdenVentaResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
