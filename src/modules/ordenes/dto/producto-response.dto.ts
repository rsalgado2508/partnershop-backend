import { ApiProperty } from '@nestjs/swagger';

export class ProductoResponseDto {
  @ApiProperty()
  idProducto: number;

  @ApiProperty()
  nombreOficial: string;
}
