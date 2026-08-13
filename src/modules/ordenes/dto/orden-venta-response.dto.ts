import { ApiProperty } from '@nestjs/swagger';
import { Cliente } from '../entities/cliente.entity';
import { Ciudad } from '../entities/ciudad.entity';
import { Transportadora } from '../entities/transportadora.entity';
import { DetalleOrdenResponseDto } from './detalle-orden-response.dto';
import { NovedadResponseDto } from './novedad-response.dto';

export class OrdenVentaResponseDto {
  @ApiProperty()
  idOrden: number;

  @ApiProperty()
  idCliente: number;

  @ApiProperty()
  idCiudad: number;

  @ApiProperty()
  idTransportadora: number;

  @ApiProperty()
  estatus: string;

  @ApiProperty()
  fechaReporte: Date;

  @ApiProperty()
  totalOrden: number;

  @ApiProperty()
  precioCantidad: number;

  @ApiProperty()
  precioFlete: number;

  @ApiProperty()
  ganancia: number;

  @ApiProperty()
  numeroGuia: string;

  @ApiProperty()
  plataforma: string;

  @ApiProperty()
  responsableVenta: string;

  @ApiProperty()
  idOrdenTienda: string;

  @ApiProperty()
  referenciaMovimiento: string;

  @ApiProperty()
  fechaCreacion: Date;

  @ApiProperty({ type: () => Cliente })
  cliente: Cliente;

  @ApiProperty({ type: () => Ciudad })
  ciudad: Ciudad;

  @ApiProperty({ type: () => Transportadora })
  transportadora: Transportadora;

  @ApiProperty({ type: () => NovedadResponseDto, nullable: true })
  novedad: NovedadResponseDto | null;

  @ApiProperty({ type: () => [DetalleOrdenResponseDto] })
  detalles: DetalleOrdenResponseDto[];
}
