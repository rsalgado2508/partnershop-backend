import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Novedad } from './entities/novedad.entity';
import { HistorialNovedad } from './entities/historial-novedad.entity';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { UpdateEstadoNovedadDto } from './dto/update-estado-novedad.dto';
import { FilterNovedadesDto } from './dto/filter-novedades.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AccionHistorial, EstadoNovedad } from '../../common/enums';
import { CognitoUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class NovedadesService {
  constructor(
    @InjectRepository(Novedad)
    private readonly novedadRepository: Repository<Novedad>,
    @InjectRepository(HistorialNovedad)
    private readonly historialRepository: Repository<HistorialNovedad>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateNovedadDto, user: CognitoUser): Promise<Novedad> {
    return this.dataSource.transaction(async (manager) => {
      const novedad = manager.create(Novedad, {
        ...dto,
        usuarioRegistro: user.username,
        estado: EstadoNovedad.ABIERTA,
      });
      const saved = await manager.save(novedad);

      const historial = manager.create(HistorialNovedad, {
        idNovedad: saved.idNovedad,
        accion: AccionHistorial.CREACION,
        estadoNuevo: EstadoNovedad.ABIERTA,
        detalle: `Novedad creada: ${dto.descripcion.substring(0, 100)}`,
        usuario: user.username,
      });
      await manager.save(historial);

      return this.findOne(saved.idNovedad);
    });
  }

  async findAll(
    filterDto: FilterNovedadesDto,
  ): Promise<PaginatedResponseDto<Novedad>> {
    const { page = 1, limit = 10, idOrden, idCategoria, estado } = filterDto;
    const skip = (page - 1) * limit;

    const qb = this.novedadRepository
      .createQueryBuilder('novedad')
      .leftJoinAndSelect('novedad.categoria', 'categoria')
      .leftJoinAndSelect('novedad.orden', 'orden');

    if (idOrden) {
      qb.andWhere('novedad.idOrden = :idOrden', { idOrden });
    }

    if (idCategoria) {
      qb.andWhere('novedad.idCategoria = :idCategoria', { idCategoria });
    }

    if (estado) {
      qb.andWhere('novedad.estado = :estado', { estado });
    }

    qb.orderBy('novedad.fechaRegistro', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: number): Promise<Novedad> {
    const novedad = await this.novedadRepository.findOne({
      where: { idNovedad: id },
      relations: ['categoria', 'orden', 'orden.cliente'],
    });

    if (!novedad) {
      throw new NotFoundException(`Novedad con ID ${id} no encontrada`);
    }

    return novedad;
  }

  async updateEstado(
    id: number,
    dto: UpdateEstadoNovedadDto,
    user: CognitoUser,
  ): Promise<Novedad> {
    return this.dataSource.transaction(async (manager) => {
      const novedad = await this.findOne(id);
      const estadoAnterior = novedad.estado;

      novedad.estado = dto.estado;
      await manager.save(novedad);

      const accion =
        dto.estado === EstadoNovedad.CERRADA
          ? AccionHistorial.CIERRE
          : AccionHistorial.CAMBIO_ESTADO;

      const historial = manager.create(HistorialNovedad, {
        idNovedad: id,
        accion,
        estadoAnterior,
        estadoNuevo: dto.estado,
        detalle: dto.detalle || `Estado cambiado de ${estadoAnterior} a ${dto.estado}`,
        usuario: user.username,
      });
      await manager.save(historial);

      return this.findOne(id);
    });
  }

  async findByOrden(idOrden: number): Promise<Novedad[]> {
    return this.novedadRepository.find({
      where: { idOrden },
      relations: ['categoria', 'historial'],
      order: { fechaRegistro: 'DESC' },
    });
  }

  async findHistorial(id: number): Promise<HistorialNovedad[]> {
    await this.findOne(id);

    return this.historialRepository.find({
      where: { idNovedad: id },
      order: { fecha: 'ASC' },
    });
  }
}
