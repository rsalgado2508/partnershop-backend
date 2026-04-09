import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NovedadesService } from './novedades.service';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { UpdateEstadoNovedadDto } from './dto/update-estado-novedad.dto';
import { FilterNovedadesDto } from './dto/filter-novedades.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import type { CognitoUser } from '../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';

@ApiTags('Novedades')
@Controller('novedades')
export class NovedadesController {
  constructor(private readonly novedadesService: NovedadesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OPERATIONS_ANALYST)
  @ApiOperation({ summary: 'Registrar una novedad sobre una orden' })
  create(@Body() dto: CreateNovedadDto, @CurrentUser() user: CognitoUser) {
    return this.novedadesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar novedades con filtros y paginación' })
  findAll(@Query() filterDto: FilterNovedadesDto) {
    return this.novedadesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una novedad' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.novedadesService.findOne(id);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN, Role.OPERATIONS_ANALYST)
  @ApiOperation({ summary: 'Cambiar estado de una novedad' })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoNovedadDto,
    @CurrentUser() user: CognitoUser,
  ) {
    return this.novedadesService.updateEstado(id, dto, user);
  }

  @Get('orden/:idOrden')
  @ApiOperation({ summary: 'Listar novedades de una orden específica' })
  findByOrden(@Param('idOrden', ParseIntPipe) idOrden: number) {
    return this.novedadesService.findByOrden(idOrden);
  }

  @Get(':id/historial')
  @ApiOperation({ summary: 'Historial de trazabilidad de una novedad' })
  findHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.novedadesService.findHistorial(id);
  }
}
