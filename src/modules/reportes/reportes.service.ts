import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterSeguimientoDiarioDto } from './dto/filter-seguimiento-diario.dto';
import { NovedadOcurrenciaResponseDto } from './dto/novedad-ocurrencia-response.dto';
import { SeguimientoDiarioResponseDto } from './dto/seguimiento-diario-response.dto';
import { SnapshotOrdenesPorEjecucion } from './entities/snapshot-ordenes-por-ejecucion.entity';

type SeguimientoDiarioRawRow = {
  fechaSeguimiento: string | Date;
  totalEntre15y20: string | number;
  totalEntre7y15: string | number;
  totalMayorA2Dias: string | number;
  totalMayorA20Dias: string | number;
};

type NovedadOcurrenciaRawRow = {
  nombre: string;
  total: string | number;
};

@Injectable()
export class ReportesService {
  private static readonly ESTATUS_GUIAS_MAYOR_A_2_DIAS = [16, 18, 22, 35, 46];

  private static readonly ESTATUS_EXCLUIDOS_MAYOR_A_20_DIAS = [15, 5, 3, 23];

  private static readonly DIAS_SEMANA = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    timeZone: 'UTC',
  });

  constructor(
    @InjectRepository(SnapshotOrdenesPorEjecucion)
    private readonly snapshotRepository: Repository<SnapshotOrdenesPorEjecucion>,
  ) {}

  async getSeguimientoDiario(
    filters: FilterSeguimientoDiarioDto,
  ): Promise<SeguimientoDiarioResponseDto[]> {
    const params: Array<string> = [];
    const whereClauses: string[] = [];

    if (filters.fechaDesde) {
      params.push(filters.fechaDesde);
      whereClauses.push(`s.fecha_snapshot >= $${params.length}`);
    }

    if (filters.fechaHasta) {
      params.push(filters.fechaHasta);
      whereClauses.push(`s.fecha_snapshot <= $${params.length}`);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const rows = await this.snapshotRepository.manager.query(
      `
        WITH snapshots_ranked AS (
          SELECT
            s.fecha_snapshot,
            s.total_entre_15_20,
            s.total_entre_7_15,
            s.total_guias_mayor_a_2_dias,
            s.total_mayor_20,
            ROW_NUMBER() OVER (
              PARTITION BY s.fecha_snapshot
              ORDER BY s.created_at DESC, s.id DESC
            ) AS rn
          FROM snapshot_ordenes_por_ejecucion s
          ${whereSql}
        )
        SELECT
          sr.fecha_snapshot AS "fechaSeguimiento",
          COALESCE(SUM(sr.total_entre_15_20), 0)::int AS "totalEntre15y20",
          COALESCE(SUM(sr.total_entre_7_15), 0)::int AS "totalEntre7y15",
          COALESCE(SUM(sr.total_guias_mayor_a_2_dias), 0)::int AS "totalMayorA2Dias",
          COALESCE(SUM(sr.total_mayor_20), 0)::int AS "totalMayorA20Dias"
        FROM snapshots_ranked sr
        WHERE sr.rn = 1
        GROUP BY sr.fecha_snapshot
        ORDER BY sr.fecha_snapshot ASC
      `,
      params,
    );

    return rows.map((row) => this.toSeguimientoDiarioResponse(row));
  }

  async getNovedadesGuiasMayorA2Dias(): Promise<
    NovedadOcurrenciaResponseDto[]
  > {
    const rows = await this.snapshotRepository.manager.query(
      `
        SELECT
          cn.nombre,
          COUNT(ov.id_orden)::int AS total
        FROM orden_venta ov
        JOIN (
          SELECT DISTINCT ON (n.id_orden)
            n.id_orden,
            n.id_categoria,
            n.id_novedad
          FROM novedad n
          ORDER BY n.id_orden, n.id_novedad DESC
        ) ult_novedad ON ult_novedad.id_orden = ov.id_orden
        JOIN categoria_novedad cn ON cn.id_categoria = ult_novedad.id_categoria
        WHERE ov.fecha_reporte < CURRENT_TIMESTAMP - INTERVAL '2 days'
          AND ov.estatus = ANY($1)
        GROUP BY cn.nombre
        ORDER BY cn.nombre
      `,
      [ReportesService.ESTATUS_GUIAS_MAYOR_A_2_DIAS],
    );

    return rows.map((row: NovedadOcurrenciaRawRow) =>
      this.toNovedadOcurrenciaResponse(row),
    );
  }

  async getNovedadesMayorA20Dias(): Promise<NovedadOcurrenciaResponseDto[]> {
    const rows = await this.snapshotRepository.manager.query(
      `
        SELECT
          cn.nombre,
          COUNT(ov.id_orden)::int AS total
        FROM orden_venta ov
        JOIN (
          SELECT DISTINCT ON (n.id_orden)
            n.id_orden,
            n.id_categoria,
            n.id_novedad
          FROM novedad n
          ORDER BY n.id_orden, n.id_novedad DESC
        ) ult_novedad ON ult_novedad.id_orden = ov.id_orden
        JOIN categoria_novedad cn ON cn.id_categoria = ult_novedad.id_categoria
        WHERE ov.fecha_reporte < CURRENT_TIMESTAMP - INTERVAL '20 days'
          AND ov.estatus <> ALL($1)
        GROUP BY cn.nombre
        ORDER BY cn.nombre
      `,
      [ReportesService.ESTATUS_EXCLUIDOS_MAYOR_A_20_DIAS],
    );

    return rows.map((row: NovedadOcurrenciaRawRow) =>
      this.toNovedadOcurrenciaResponse(row),
    );
  }

  private toSeguimientoDiarioResponse(
    row: SeguimientoDiarioRawRow,
  ): SeguimientoDiarioResponseDto {
    const fechaSeguimiento = this.normalizeFechaSeguimiento(
      row.fechaSeguimiento,
    );
    const totalEntre15y20 = this.toNumber(row.totalEntre15y20);
    const totalEntre7y15 = this.toNumber(row.totalEntre7y15);
    const totalGuiasMayorA2Dias = this.toNumber(row.totalMayorA2Dias);
    const totalMayorA20 = this.toNumber(row.totalMayorA20Dias);
    const totalAcumulado =
      totalEntre15y20 + totalEntre7y15 + totalGuiasMayorA2Dias + totalMayorA20;

    return {
      fechaSeguimiento,
      diaSeguimiento: this.getDiaSeguimiento(fechaSeguimiento),
      totalEntre15y20,
      totalEntre7y15,
      totalGuiasMayorA2Dias,
      totalMayorA20,
      sumaTotal: Number((totalAcumulado / 4).toFixed(2)),
      totalAcumulado,
    };
  }

  private toNovedadOcurrenciaResponse(
    row: NovedadOcurrenciaRawRow,
  ): NovedadOcurrenciaResponseDto {
    return {
      nombre: row.nombre,
      total: this.toNumber(row.total),
    };
  }

  private getDiaSeguimiento(fechaSeguimiento: string): string {
    const [year, month, day] = fechaSeguimiento.split('-').map(Number);

    return ReportesService.DIAS_SEMANA.format(
      new Date(Date.UTC(year, month - 1, day)),
    ).toLowerCase();
  }

  private normalizeFechaSeguimiento(fechaSeguimiento: string | Date): string {
    if (fechaSeguimiento instanceof Date) {
      return fechaSeguimiento.toISOString().slice(0, 10);
    }

    if (typeof fechaSeguimiento === 'string') {
      return fechaSeguimiento.slice(0, 10);
    }

    throw new RangeError('Fecha de seguimiento invalida');
  }

  private toNumber(value: string | number): number {
    return typeof value === 'number' ? value : Number(value);
  }
}
