import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DetalleOrden, OrdenVenta, Producto } from './entities';
import { FilterOrdenesDto } from './dto/filter-ordenes.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Cliente } from './entities/cliente.entity';
import { Ciudad } from './entities/ciudad.entity';
import { Transportadora } from './entities/transportadora.entity';
import { Novedad } from '../novedades/entities/novedad.entity';
import { CategoriaNovedad } from '../categorias-novedad/entities/categoria-novedad.entity';

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
  novedad_id_novedad?: number | null;
  novedad_id_categoria?: number | null;
  novedad_descripcion?: string | null;
  novedad_estado?: string | null;
  novedad_usuario_registro?: string | null;
  novedad_fecha_registro?: Date | string | null;
  novedad_fecha_actualizacion?: Date | string | null;
  novedad_categoria_nombre?: string | null;
  novedad_categoria_descripcion?: string | null;
  novedad_categoria_activo?: boolean | null;
  novedad_categoria_fecha_creacion?: Date | string | null;
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
      SELECT
        ov.*,
        ult_nov.id_novedad AS novedad_id_novedad,
        ult_nov.id_categoria AS novedad_id_categoria,
        ult_nov.descripcion AS novedad_descripcion,
        ult_nov.estado AS novedad_estado,
        ult_nov.usuario_registro AS novedad_usuario_registro,
        ult_nov.fecha_registro AS novedad_fecha_registro,
        ult_nov.fecha_actualizacion AS novedad_fecha_actualizacion,
        ult_nov.categoria_nombre AS novedad_categoria_nombre,
        ult_nov.categoria_descripcion AS novedad_categoria_descripcion,
        ult_nov.categoria_activo AS novedad_categoria_activo,
        ult_nov.categoria_fecha_creacion AS novedad_categoria_fecha_creacion
      FROM view_ordenes ov
      LEFT JOIN LATERAL (
        SELECT
          n.id_novedad,
          n.id_categoria,
          n.descripcion,
          n.estado,
          n.usuario_registro,
          n.fecha_registro,
          n.fecha_actualizacion,
          cn.nombre AS categoria_nombre,
          cn.descripcion AS categoria_descripcion,
          cn.activo AS categoria_activo,
          cn.fecha_creacion AS categoria_fecha_creacion
        FROM novedad n
        LEFT JOIN categoria_novedad cn ON cn.id_categoria = n.id_categoria
        WHERE n.id_orden = ov.id_orden
        ORDER BY n.fecha_registro DESC, n.id_novedad DESC
        LIMIT 1
      ) ult_nov ON TRUE
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
    const producto: Producto = {
      idProducto: row.id_producto ?? 0,
      nombreOficial: this.toString(row.producto),
    };
    const ordenVenta: OrdenVenta = {
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
      novedad: this.toNovedad(row),
      detalles: [],
    };

    const detalle: DetalleOrden = {
      idDetalle: 0,
      idOrden: row.id_orden,
      idProducto: row.id_producto ?? 0,
      cantidad: this.toNumber(row.cantidad),
      producto: producto,
    };

    ordenVenta.detalles = [detalle];
    return ordenVenta;
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

  private toNovedad(row: ViewOrdenRow): Novedad | null {
    if (!row.novedad_id_novedad) {
      return null;
    }

    const categoria: CategoriaNovedad = {
      idCategoria: row.novedad_id_categoria ?? 0,
      nombre: this.toString(row.novedad_categoria_nombre ?? null),
      descripcion: this.toString(row.novedad_categoria_descripcion ?? null),
      activo: row.novedad_categoria_activo ?? false,
      fechaCreacion: this.toDate(row.novedad_categoria_fecha_creacion ?? null),
      novedades: [],
    };

    return {
      idNovedad: row.novedad_id_novedad,
      idOrden: row.id_orden,
      idCategoria: row.novedad_id_categoria ?? 0,
      descripcion: this.toString(row.novedad_descripcion ?? null),
      estado: this.toString(row.novedad_estado ?? null) as Novedad['estado'],
      usuarioRegistro: this.toString(row.novedad_usuario_registro ?? null),
      fechaRegistro: this.toDate(row.novedad_fecha_registro ?? null),
      fechaActualizacion: this.toDate(row.novedad_fecha_actualizacion ?? null),
      categoria,
      historial: [],
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

    orden.novedad =
      (await this.dataSource.getRepository(Novedad).findOne({
        where: { idOrden },
        relations: ['categoria'],
        order: { fechaRegistro: 'DESC', idNovedad: 'DESC' },
      })) ?? null;

    return orden;
  }
}
