import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdenesService } from './ordenes.service';
import { FilterOrdenesDto } from './dto/filter-ordenes.dto';

@ApiTags('Órdenes')
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar órdenes con filtros y paginación' })
  findAll(@Query() filterDto: FilterOrdenesDto) {
    return this.ordenesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una orden' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenesService.findOne(id);
  }
}
