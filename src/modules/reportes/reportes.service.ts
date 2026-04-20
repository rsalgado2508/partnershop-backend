import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FilterSeguimientoDiarioDto } from './dto/filter-seguimiento-diario.dto';
import { SeguimientoDiarioResponseDto } from './dto/seguimiento-diario-response.dto';

type SeguimientoDiarioRawRow = {
  fechaSeguimiento: string | Date;
  totalEntre15y20: string | number;
  totalEntre7y15: string | number;
  totalMayorA2Dias: string | number;
  totalMayorA20Dias: string | number;
};

@Injectable()
export class ReportesService {
  private static readonly ESTADOS_GUIAS_MAYOR_A_2_DIAS = [
    'GUIA_GENERADA',
    'ENTREGADO A TRANSPORTADORA',
    'POR RECOLECTAR',
    'ALISTADO',
    'PENDIENTE',
  ];

  private static readonly ESTADOS_EXCLUIDOS = [
    'ENTREGADO',
    'DEVOLUCION',
    'CANCELADO',
    'RECHAZADO',
    'GUIA_ANULADA',
    'ANULADO',
  ];

  private static readonly DIAS_SEMANA = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    timeZone: 'UTC',
  });

  constructor(private readonly dataSource: DataSource) {}

  async getSeguimientoDiario(
    filters: FilterSeguimientoDiarioDto,
  ): Promise<SeguimientoDiarioResponseDto[]> {
    const qb = this.dataSource
      .createQueryBuilder()
      .from('view_detalle_ordenes_general', 'vdog')
      .select('DATE(vdog.fecha_reporte)', 'fechaSeguimiento')
      .addSelect(
        `COUNT(*) FILTER (
          WHERE vdog.estado_entre_15_20 > 0
            AND vdog.estado NOT IN (:...estadosExcluidos)
        )::int`,
        'totalEntre15y20',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE vdog.estado_entre_7_15 > 0
            AND vdog.estado NOT IN (:...estadosExcluidos)
        )::int`,
        'totalEntre7y15',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE vdog.guias_mayor_a_2_dias > 0
            AND vdog.estado IN (:...estadosGuiasMayorA2Dias)
        )::int`,
        'totalMayorA2Dias',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE vdog.estado_mayor_20 > 0
            AND vdog.estado NOT IN (:...estadosExcluidos)
        )::int`,
        'totalMayorA20Dias',
      )
      .where(
        `vdog.guias_mayor_a_2_dias > 0
         OR vdog.estado_entre_15_20 > 0
         OR vdog.estado_entre_7_15 > 0
         OR vdog.estado_mayor_20 > 0`,
      )
      .groupBy('DATE(vdog.fecha_reporte)')
      .orderBy('DATE(vdog.fecha_reporte)', 'ASC')
      .setParameter(
        'estadosGuiasMayorA2Dias',
        ReportesService.ESTADOS_GUIAS_MAYOR_A_2_DIAS,
      )
      .setParameter('estadosExcluidos', ReportesService.ESTADOS_EXCLUIDOS);

    if (filters.fechaDesde) {
      qb.andWhere('DATE(vdog.fecha_reporte) >= :fechaDesde', {
        fechaDesde: filters.fechaDesde,
      });
    }

    if (filters.fechaHasta) {
      qb.andWhere('DATE(vdog.fecha_reporte) <= :fechaHasta', {
        fechaHasta: filters.fechaHasta,
      });
    }

    if (filters.plataforma) {
      qb.andWhere('vdog.plataforma = :plataforma', {
        plataforma: filters.plataforma,
      });
    }

    const rows = await qb.getRawMany<SeguimientoDiarioRawRow>();

    return rows.map((row) => this.toSeguimientoDiarioResponse(row));
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
      totalEntre15y20 +
      totalEntre7y15 +
      totalGuiasMayorA2Dias +
      totalMayorA20;

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
