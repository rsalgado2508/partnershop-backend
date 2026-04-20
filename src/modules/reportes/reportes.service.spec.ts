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

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueryBuilder.getRawMany.mockResolvedValue([
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
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
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

    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'snapshot.fechaSnapshot >= :fechaDesde',
      { fechaDesde: '2026-01-01' },
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'snapshot.fechaSnapshot <= :fechaHasta',
      { fechaHasta: '2026-01-31' },
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'snapshot.plataforma = :plataforma',
      { plataforma: 'shopify' },
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
