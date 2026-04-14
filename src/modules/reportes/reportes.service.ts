import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterSeguimientoDiarioDto } from './dto/filter-seguimiento-diario.dto';
import { SeguimientoDiarioResponseDto } from './dto/seguimiento-diario-response.dto';
import { SnapshotOrdenesPorEjecucion } from './entities/snapshot-ordenes-por-ejecucion.entity';

type SeguimientoDiarioRawRow = {
  fechaSeguimiento: string | Date;
  totalEntre15y20: string | number;
  totalEntre7y15: string | number;
  totalGuiasMayorA2Dias: string | number;
  totalMayorA20: string | number;
};

@Injectable()
export class ReportesService {
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
    const qb = this.snapshotRepository
      .createQueryBuilder('snapshot')
      .select('snapshot.fechaSnapshot', 'fechaSeguimiento')
      .addSelect(
        'COALESCE(SUM(snapshot.totalEntre1520), 0)::int',
        'totalEntre15y20',
      )
      .addSelect(
        'COALESCE(SUM(snapshot.totalEntre715), 0)::int',
        'totalEntre7y15',
      )
      .addSelect(
        'COALESCE(SUM(snapshot.totalGuiasMayorA2Dias), 0)::int',
        'totalGuiasMayorA2Dias',
      )
      .addSelect(
        'COALESCE(SUM(snapshot.totalMayor20), 0)::int',
        'totalMayorA20',
      )
      .groupBy('snapshot.fechaSnapshot')
      .orderBy('snapshot.fechaSnapshot', 'ASC');

    if (filters.fechaDesde) {
      qb.andWhere('snapshot.fechaSnapshot >= :fechaDesde', {
        fechaDesde: filters.fechaDesde,
      });
    }

    if (filters.fechaHasta) {
      qb.andWhere('snapshot.fechaSnapshot <= :fechaHasta', {
        fechaHasta: filters.fechaHasta,
      });
    }

    if (filters.plataforma) {
      qb.andWhere('snapshot.plataforma = :plataforma', {
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
    const totalGuiasMayorA2Dias = this.toNumber(row.totalGuiasMayorA2Dias);
    const totalMayorA20 = this.toNumber(row.totalMayorA20);
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
