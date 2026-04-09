import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriasNovedadService } from './categorias-novedad.service';
import { CreateCategoriaNovedadDto } from './dto/create-categoria-novedad.dto';
import { UpdateCategoriaNovedadDto } from './dto/update-categoria-novedad.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('Categorías de Novedad')
@Controller('categorias-novedad')
export class CategoriasNovedadController {
  constructor(private readonly service: CategoriasNovedadService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear una categoría de novedad' })
  create(@Body() dto: CreateCategoriaNovedadDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías activas' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una categoría' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoriaNovedadDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desactivar una categoría (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
