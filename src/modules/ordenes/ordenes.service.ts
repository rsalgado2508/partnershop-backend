import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrdenVenta } from './entities';
import { FilterOrdenesDto } from './dto/filter-ordenes.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Cliente } from './entities/cliente.entity';
import { Ciudad } from './entities/ciudad.entity';
import { Transportadora } from './entities/transportadora.entity';

type ViewOrdenRow = {
  id_orden: number;
  id_orden_tienda: string | null;
  fecha_reporte: Date | string | null;
  numero_guia: string | null;
  estado: string | null;
  departamento: string | null;
  nombre_ciudad: string | null;
  transportadora: string | null;
  total_orden: string | number | null;
  precio_flete: string | number | null;
  precio_cantidad: string | number | null;
  id_producto: number | null;
  producto: string | null;
  cantidad: string | number | null;
  cliente: string | null;
  plataforma: string | null;
};

type SqlCondition = {
  clause: string;
  values: Array<string | number>;
};

@Injectable()
export class OrdenesService {
  private static readonly ESTATUS_GUIAS_MAYOR_A_2_DIAS = [
    'GUIA_GENERADA',
    'ENTREGADO A TRANSPORTADORA',
    'POR RECOLECTAR',
    'ALISTADO',
    'PENDIENTE',
  ];

  private static readonly ESTADOS_EXCLUIDOS_RANGOS = [
    'ENTREGADO',
    'DEVOLUCION',
    'CANCELADO',
    'RECHAZADO',
    'GUIA_ANULADA',
    'ANULADO',
  ];

  constructor(
    @InjectRepository(OrdenVenta)
    private readonly ordenRepository: Repository<OrdenVenta>,
    private readonly dataSource: DataSource,
  ) {}

  private getRangoFechaReporteCondition(
    rangoFechaReporte: FilterOrdenesDto['rangoFechaReporte'],
  ): SqlCondition | null {
    switch (rangoFechaReporte) {
      case 'ultimos_7_dias':
        return {
          clause: `ov.fecha_reporte >= CURRENT_TIMESTAMP - INTERVAL '7 days'
            AND ov.fecha_reporte <= CURRENT_TIMESTAMP
            AND ov.estado NOT IN (${this.getSqlPlaceholders(
              OrdenesService.ESTADOS_EXCLUIDOS_RANGOS.length,
            )})`,
          values: [...OrdenesService.ESTADOS_EXCLUIDOS_RANGOS],
        };
      case 'entre_7_y_15_dias':
        return {
          clause: `ov.fecha_reporte >= CURRENT_TIMESTAMP - INTERVAL '15 days'
            AND ov.fecha_reporte <= CURRENT_TIMESTAMP - INTERVAL '7 days'
            AND ov.estado NOT IN (${this.getSqlPlaceholders(
              OrdenesService.ESTADOS_EXCLUIDOS_RANGOS.length,
            )})`,
          values: [...OrdenesService.ESTADOS_EXCLUIDOS_RANGOS],
        };
      case 'entre_15_y_20_dias':
        return {
          clause: `ov.fecha_reporte >= CURRENT_TIMESTAMP - INTERVAL '20 days'
            AND ov.fecha_reporte <= CURRENT_TIMESTAMP - INTERVAL '15 days'
            AND ov.estado NOT IN (${this.getSqlPlaceholders(
              OrdenesService.ESTADOS_EXCLUIDOS_RANGOS.length,
            )})`,
          values: [...OrdenesService.ESTADOS_EXCLUIDOS_RANGOS],
        };
      case 'mas_de_20_dias':
        return {
          clause: `ov.fecha_reporte < CURRENT_TIMESTAMP - INTERVAL '20 days'
            AND ov.estado NOT IN (${this.getSqlPlaceholders(
              OrdenesService.ESTADOS_EXCLUIDOS_RANGOS.length,
            )})`,
          values: [...OrdenesService.ESTADOS_EXCLUIDOS_RANGOS],
        };
      case 'guias_mayor_a_2_dias':
        return {
          clause: `ov.fecha_reporte < CURRENT_TIMESTAMP - INTERVAL '2 days'
            AND ov.estado IN (${this.getSqlPlaceholders(
              OrdenesService.ESTATUS_GUIAS_MAYOR_A_2_DIAS.length,
            )})`,
          values: [...OrdenesService.ESTATUS_GUIAS_MAYOR_A_2_DIAS],
        };
      default:
        return null;
    }
  }

  private getSqlPlaceholders(length: number, startIndex = 1): string {
    return Array.from({ length }, (_, index) => `$${startIndex + index}`).join(
      ', ',
    );
  }

  private buildFindAllWhereClause(filterDto: FilterOrdenesDto): SqlCondition {
    const conditions: string[] = [];
    const values: Array<string | number> = [];

    if (filterDto.estatus) {
      values.push(filterDto.estatus);
      conditions.push(`ov.estado = $${values.length}`);
    }

    if (filterDto.busqueda) {
      const search = `%${filterDto.busqueda}%`;
      values.push(search, search, search);
      conditions.push(`(
        CAST(ov.id_orden AS TEXT) ILIKE $${values.length - 2}
        OR CAST(ov.numero_guia AS TEXT) ILIKE $${values.length - 1}
        OR CAST(ov.id_orden_tienda AS TEXT) ILIKE $${values.length}
      )`);
    }

    if (filterDto.plataforma) {
      values.push(filterDto.plataforma);
      conditions.push(`ov.plataforma = $${values.length}`);
    }

    if (filterDto.rangoFechaReporte) {
      const rango = this.getRangoFechaReporteCondition(
        filterDto.rangoFechaReporte,
      );

      if (rango) {
        const offset = values.length;
        values.push(...rango.values);
        conditions.push(
          rango.clause.replace(/\$(\d+)/g, (_, index: string) => {
            return `$${Number(index) + offset}`;
          }),
        );
      }
    }

    return {
      clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  async findAll(
    filterDto: FilterOrdenesDto,
  ): Promise<PaginatedResponseDto<OrdenVenta>> {
    const { page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;
    const where = this.buildFindAllWhereClause(filterDto);
    const selectSql = `
      SELECT ov.*
      FROM view_ordenes ov
      ${where.clause}
      ORDER BY ov.fecha_reporte DESC, ov.id_orden DESC
      LIMIT $${where.values.length + 1}
      OFFSET $${where.values.length + 2}
    `;
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM view_ordenes ov
      ${where.clause}
    `;
    const [rows, countRows] = await Promise.all([
      this.dataSource.query(selectSql, [...where.values, limit, skip]),
      this.dataSource.query(countSql, where.values),
    ]);
    const total = countRows[0]?.total ?? 0;
    const data = rows.map((row: ViewOrdenRow) => this.toOrdenVenta(row));

    return new PaginatedResponseDto(data, total, page, limit);
  }

  private toOrdenVenta(row: ViewOrdenRow): OrdenVenta {
    return {
      idOrden: row.id_orden,
      idCliente: 0,
      idCiudad: 0,
      idTransportadora: 0,
      estatus: this.toString(row.estado),
      fechaReporte: this.toDate(row.fecha_reporte),
      totalOrden: this.toNumber(row.total_orden),
      precioCantidad: this.toNumber(row.precio_cantidad),
      precioFlete: this.toNumber(row.precio_flete),
      ganancia: 0,
      numeroGuia: this.toString(row.numero_guia),
      plataforma: this.toString(row.plataforma),
      responsableVenta: '',
      idOrdenTienda: this.toString(row.id_orden_tienda),
      referenciaMovimiento: '',
      fechaCreacion: this.toDate(row.fecha_reporte),
      cliente: this.toCliente(row.cliente),
      ciudad: this.toCiudad(row.nombre_ciudad, row.departamento),
      transportadora: this.toTransportadora(row.transportadora),
      detalles: [],
    };
  }

  private toCliente(nombreCliente: string | null): Cliente {
    return {
      idCliente: 0,
      nombreOficial: this.toString(nombreCliente),
      telefono: '',
      email: '',
      tipoIdentificacion: '',
      numeroIdentificacion: '',
    };
  }

  private toCiudad(
    nombreCiudad: string | null,
    departamento: string | null,
  ): Ciudad {
    return {
      idCiudad: 0,
      nombreCiudad: this.toString(nombreCiudad),
      departamento: this.toString(departamento),
    };
  }

  private toTransportadora(
    nombreTransportadora: string | null,
  ): Transportadora {
    return {
      idTransportadora: 0,
      nombre: this.toString(nombreTransportadora),
    };
  }

  private toNumber(value: string | number | null): number {
    if (value === null) {
      return 0;
    }

    return typeof value === 'number' ? value : Number(value);
  }

  private toString(value: string | null): string {
    return value ?? '';
  }

  private toDate(value: string | Date | null): Date {
    return value ? new Date(value) : new Date(0);
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
