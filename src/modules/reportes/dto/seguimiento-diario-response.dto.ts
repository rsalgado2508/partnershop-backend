import { ApiProperty } from '@nestjs/swagger';

export class SeguimientoDiarioResponseDto {
  @ApiProperty({ example: '2026-01-22' })
  fechaSeguimiento: string;

  @ApiProperty({ example: 'jueves' })
  diaSeguimiento: string;

  @ApiProperty({ example: 2 })
  totalEntre15y20: number;

  @ApiProperty({ example: 2 })
  totalEntre7y15: number;

  @ApiProperty({ example: 7 })
  totalGuiasMayorA2Dias: number;

  @ApiProperty({ example: 60 })
  totalMayorA20: number;

  @ApiProperty({ example: 17.75 })
  sumaTotal: number;

  @ApiProperty({ example: 71 })
  totalAcumulado: number;
}
