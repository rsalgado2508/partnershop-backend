import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateNovedadDto {
  @ApiProperty({ description: 'ID de la orden asociada' })
  @IsNotEmpty()
  @IsInt()
  idOrden: number;

  @ApiProperty({ description: 'ID de la categoría de novedad' })
  @IsNotEmpty()
  @IsInt()
  idCategoria: number;

  @ApiProperty({ description: 'Descripción detallada de la novedad' })
  @IsNotEmpty()
  @IsString()
  descripcion: string;
}
