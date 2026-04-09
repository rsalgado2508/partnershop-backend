import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenVenta } from './entities';
import { FilterOrdenesDto } from './dto/filter-ordenes.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(OrdenVenta)
    private readonly ordenRepository: Repository<OrdenVenta>,
  ) {}

  async findAll(
    filterDto: FilterOrdenesDto,
  ): Promise<PaginatedResponseDto<OrdenVenta>> {
    const { page = 1, limit = 10, estatus, busqueda, plataforma } = filterDto;
    const skip = (page - 1) * limit;

    const qb = this.ordenRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.cliente', 'cliente')
      .leftJoinAndSelect('orden.ciudad', 'ciudad')
      .leftJoinAndSelect('orden.transportadora', 'transportadora');

    if (estatus) {
      qb.andWhere('orden.estatus = :estatus', { estatus });
    }

    if (busqueda) {
      qb.andWhere(
        '(CAST(orden.idOrden AS TEXT) LIKE :busqueda OR orden.numeroGuia ILIKE :busquedaLike)',
        {
          busqueda: `%${busqueda}%`,
          busquedaLike: `%${busqueda}%`,
        },
      );
    }

    if (plataforma) {
      qb.andWhere('orden.plataforma = :plataforma', { plataforma });
    }

    qb.orderBy('orden.fechaCreacion', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(idOrden: number): Promise<OrdenVenta> {
    const orden = await this.ordenRepository.findOne({
      where: { idOrden },
      relations: [
        'cliente',
        'ciudad',
        'transportadora',
        'detalles',
        'detalles.producto',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden con ID ${idOrden} no encontrada`);
    }

    return orden;
  }
}
