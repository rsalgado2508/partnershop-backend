import { Controller, Get, Param, ParseIntPipe, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdenesService } from './ordenes.service';
import {
  FilterOrdenesDto,
  RANGOS_FECHA_REPORTE,
} from './dto/filter-ordenes.dto';
import { ExportOrdenesDto } from './dto/export-ordenes.dto';
import { PaginatedOrdenesResponseDto } from './dto/paginated-ordenes-response.dto';
import { OrdenVentaResponseDto } from './dto/orden-venta-response.dto';
import { Public } from 'src/common/decorators/public.decorator';

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
    name: 'idCategoriaNovedad',
    required: false,
    type: Number,
    example: 3,
    description: 'Filtra por la categoría de la última novedad registrada.',
  })
  @ApiQuery({
    name: 'transportadora',
    required: false,
    type: String,
    example: 'Coordinadora',
    description: 'Filtra por nombre de transportadora.',
  })
  @ApiQuery({
    name: 'fechaReporteDesde',
    required: false,
    type: String,
    example: '2026-05-01',
    description: 'Fecha inicial de reporte en formato YYYY-MM-DD.',
  })
  @ApiQuery({
    name: 'fechaReporteHasta',
    required: false,
    type: String,
    example: '2026-05-22',
    description: 'Fecha final de reporte en formato YYYY-MM-DD.',
  })
  @ApiQuery({
    name: 'rangoFechaReporte',
    required: false,
    enum: RANGOS_FECHA_REPORTE,
    example: 'guias_mayor_a_2_dias',
    description:
      'Filtra por rango relativo de `fechaReporte`. El valor `guias_mayor_a_2_dias` además restringe a los estados `GUIA_GENERADA`, `ENTREGADO A TRANSPORTADORA`, `POR RECOLECTAR`, `ALISTADO` y `PENDIENTE`.',
  })
  @Public()
  @ApiOkResponse({ type: PaginatedOrdenesResponseDto })
  findAll(@Query() filterDto: FilterOrdenesDto) {
    return this.ordenesService.findAll(filterDto);
  }

  @Get('transportadoras')
  @ApiOperation({ summary: 'Listar transportadoras disponibles' })
  @Public()
  findTransportadoras() {
    return this.ordenesService.findTransportadoras();
  }

  @Get('plataformas')
  @ApiOperation({ summary: 'Listar plataformas presentes en las órdenes' })
  @ApiOkResponse({ type: String, isArray: true })
  @Public()
  findPlataformas() {
    return this.ordenesService.findPlataformas();
  }

  @Get('export-csv')
  @ApiOperation({
    summary: 'Exportar órdenes a CSV',
    description: 'Exporta todas las órdenes filtradas como archivo CSV. Máximo 50,000 registros.',
  })
  @Public()
  async exportCsv(
    @Query() filterDto: ExportOrdenesDto,
    @Res() res: Response,
  ): Promise<void> {
    const ordenes = await this.ordenesService.findAllForCsv(filterDto);
    
    const headers = [
      'Id orden',
      'Orden tienda',
      'Cliente',
      'Producto',
      'Categoría comentario',
      'Ciudad',
      'Plataforma',
      'Estatus',
      'Total',
      'Fecha reporte',
      'Guía',
      'Transportadora',
    ];
    
    const csvRows = ordenes.map((orden) => [
      String(orden.idOrden),
      orden.idOrdenTienda || '',
      orden.cliente?.nombreOficial || '',
      orden.detalles?.map((d) => d.producto?.nombreOficial).join('; ') || '',
      orden.novedad?.categoria?.nombre || '',
      orden.ciudad?.nombreCiudad || '',
      orden.plataforma || '',
      orden.estatus || '',
      String(orden.totalOrden || 0),
      orden.fechaReporte ? new Date(orden.fechaReporte).toISOString().split('T')[0] : '',
      orden.numeroGuia || '',
      orden.transportadora?.nombre || '',
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const timestamp = new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .format(new Date())
      .replace(' ', '_')
      .replace(/:/g, '-');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=ordenes-${timestamp}.csv`);
    res.end(`\uFEFF${csvContent}`);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una orden' })
  @ApiOkResponse({ type: OrdenVentaResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenesService.findOne(id);
  }
}
