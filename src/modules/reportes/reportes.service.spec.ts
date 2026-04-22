import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportesService } from './reportes.service';
import { SnapshotOrdenesPorEjecucion } from './entities/snapshot-ordenes-por-ejecucion.entity';

describe('ReportesService', () => {
  let service: ReportesService;
  const mockManager = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockManager.query.mockResolvedValue([
      {
        fechaSeguimiento: '2026-01-22',
        totalEntre15y20: 2,
        totalEntre7y15: 3,
        totalMayorA2Dias: 7,
        totalMayorA20Dias: 60,
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        {
          provide: getRepositoryToken(SnapshotOrdenesPorEjecucion),
          useValue: {
            manager: mockManager,
          },
        },
      ],
    }).compile();

    service = module.get<ReportesService>(ReportesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should aggregate snapshots by fechaSnapshot and keep dto shape', async () => {
    const result = await service.getSeguimientoDiario({});

    expect(result).toEqual([
      {
        fechaSeguimiento: '2026-01-22',
        diaSeguimiento: 'jueves',
        totalEntre15y20: 2,
        totalEntre7y15: 3,
        totalGuiasMayorA2Dias: 7,
        totalMayorA20: 60,
        sumaTotal: 18,
        totalAcumulado: 72,
      },
    ]);
  });

  it('should apply snapshot filters', async () => {
    await service.getSeguimientoDiario({
      fechaDesde: '2026-01-01',
      fechaHasta: '2026-01-31',
      plataforma: 'shopify',
    });

    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining('s.fecha_snapshot >= $1'),
      ['2026-01-01', '2026-01-31', 'shopify'],
    );
    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining('s.fecha_snapshot <= $2'),
      ['2026-01-01', '2026-01-31', 'shopify'],
    );
    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining('s.plataforma = $3'),
      ['2026-01-01', '2026-01-31', 'shopify'],
    );
  });

  it('should rank snapshots by fecha and plataforma using the most recent record', async () => {
    await service.getSeguimientoDiario({});

    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining('ROW_NUMBER() OVER'),
      [],
    );
    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining('PARTITION BY s.fecha_snapshot, s.plataforma'),
      [],
    );
    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY s.created_at DESC, s.id DESC'),
      [],
    );
  });

  it('should return novedad occurrences for guias mayor a 2 dias', async () => {
    mockManager.query.mockResolvedValueOnce([
      { nombre: 'SIN GESTION LOGISTICA', total: '4' },
      { nombre: 'TRANSPORTADORA', total: 2 },
    ]);

    const result = await service.getNovedadesGuiasMayorA2Dias();

    expect(result).toEqual([
      { nombre: 'SIN GESTION LOGISTICA', total: 4 },
      { nombre: 'TRANSPORTADORA', total: 2 },
    ]);
    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining("CURRENT_TIMESTAMP - INTERVAL '2 days'"),
      [[16, 18, 22, 35, 46]],
    );
  });

  it('should return novedad occurrences for orders mayor a 20 dias', async () => {
    mockManager.query.mockResolvedValueOnce([
      { nombre: 'CLIENTE', total: '7' },
    ]);

    const result = await service.getNovedadesMayorA20Dias();

    expect(result).toEqual([{ nombre: 'CLIENTE', total: 7 }]);
    expect(mockManager.query).toHaveBeenCalledWith(
      expect.stringContaining("CURRENT_TIMESTAMP - INTERVAL '20 days'"),
      [[15, 5, 3, 23]],
    );
  });
});
