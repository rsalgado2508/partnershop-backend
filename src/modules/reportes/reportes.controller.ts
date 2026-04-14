import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FilterSeguimientoDiarioDto } from './dto/filter-seguimiento-diario.dto';
import { SeguimientoDiarioResponseDto } from './dto/seguimiento-diario-response.dto';
import { ReportesService } from './reportes.service';

@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('seguimiento-diario')
  @ApiOperation({
    summary: 'Obtener el consolidado diario para la tabla de seguimiento',
  })
  @ApiQuery({ name: 'fechaDesde', required: false, type: String })
  @ApiQuery({ name: 'fechaHasta', required: false, type: String })
  @ApiQuery({ name: 'plataforma', required: false, type: String })
  @ApiOkResponse({ type: SeguimientoDiarioResponseDto, isArray: true })
  getSeguimientoDiario(@Query() filters: FilterSeguimientoDiarioDto) {
    return this.reportesService.getSeguimientoDiario(filters);
  }
}
