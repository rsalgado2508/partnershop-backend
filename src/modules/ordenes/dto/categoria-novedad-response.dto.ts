import { ApiProperty } from '@nestjs/swagger';

export class CategoriaNovedadResponseDto {
  @ApiProperty()
  idCategoria: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  fechaCreacion: Date;
}
