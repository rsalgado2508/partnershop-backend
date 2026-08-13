import { ApiProperty } from '@nestjs/swagger';
import { ProductoResponseDto } from './producto-response.dto';

export class DetalleOrdenResponseDto {
  @ApiProperty()
  idDetalle: number;

  @ApiProperty()
  idOrden: number;

  @ApiProperty()
  idProducto: number;

  @ApiProperty()
  cantidad: number;

  @ApiProperty({ type: () => ProductoResponseDto })
  producto: ProductoResponseDto;
}
