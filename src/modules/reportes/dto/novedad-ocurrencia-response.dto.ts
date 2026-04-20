import { ApiProperty } from '@nestjs/swagger';

export class NovedadOcurrenciaResponseDto {
  @ApiProperty({ example: 'SIN GESTION LOGISTICA' })
  nombre: string;

  @ApiProperty({ example: 12 })
  total: number;
}
