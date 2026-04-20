import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdenesService } from './ordenes.service';
import {
  FilterOrdenesDto,
  RANGOS_FECHA_REPORTE,
} from './dto/filter-ordenes.dto';

@ApiTags('Órdenes')
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar órdenes con filtros y paginación',
    description:
      'Permite consultar órdenes usando filtros opcionales. Ejemplos: `/api/ordenes?page=1&limit=10`, `/api/ordenes?busqueda=12345`, `/api/ordenes?plataforma=shopify&rangoFechaReporte=guias_mayor_a_2_dias`, `/api/ordenes?estatus=PENDIENTE&rangoFechaReporte=mas_de_20_dias`.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Número de página.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Cantidad de registros por página.',
  })
  @ApiQuery({
    name: 'estatus',
    required: false,
    type: String,
    example: 'PENDIENTE',
    description: 'Filtra por el estatus actual de la orden.',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    type: String,
    example: '12345',
    description:
      'Busca por `idOrden`, `numeroGuia` o `idOrdenTienda`.',
  })
  @ApiQuery({
    name: 'plataforma',
    required: false,
    type: String,
    example: 'shopify',
    description: 'Filtra por plataforma.',
  })
  @ApiQuery({
    name: 'rangoFechaReporte',
    required: false,
    enum: RANGOS_FECHA_REPORTE,
    example: 'guias_mayor_a_2_dias',
    description:
      'Filtra por rango relativo de `fechaReporte`. El valor `guias_mayor_a_2_dias` además restringe a los estados `GUIA_GENERADA`, `ENTREGADO A TRANSPORTADORA`, `POR RECOLECTAR`, `ALISTADO` y `PENDIENTE`.',
  })
  findAll(@Query() filterDto: FilterOrdenesDto) {
    return this.ordenesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una orden' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenesService.findOne(id);
  }
}
