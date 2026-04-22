import { ApiProperty } from '@nestjs/swagger';
import { CategoriaNovedadResponseDto } from './categoria-novedad-response.dto';

export class NovedadResponseDto {
  @ApiProperty()
  idNovedad: number;

  @ApiProperty()
  idOrden: number;

  @ApiProperty()
  idCategoria: number;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  usuarioRegistro: string;

  @ApiProperty()
  fechaRegistro: Date;

  @ApiProperty()
  fechaActualizacion: Date;

  @ApiProperty({ type: () => CategoriaNovedadResponseDto })
  categoria: CategoriaNovedadResponseDto;
}
