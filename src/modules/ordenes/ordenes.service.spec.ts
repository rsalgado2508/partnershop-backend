import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { OrdenVenta } from './entities';

const mockOrden: Partial<OrdenVenta> = {
  idOrden: 1,
  estatus: 'ENTREGADO',
  plataforma: 'MercadoLibre',
  numeroGuia: 'ML12345',
  fechaCreacion: new Date(),
};

const mockViewOrden = {
  id_orden: 1,
  id_orden_tienda: 'T-123',
  fecha_reporte: '2026-04-20T00:00:00.000Z',
  numero_guia: 'ML12345',
  estado: 'PENDIENTE',
  departamento: 'Cundinamarca',
  nombre_ciudad: 'Bogota',
  transportadora: 'Coordinadora',
  total_orden: '100000',
  precio_flete: '12000',
  precio_cantidad: '88000',
  id_producto: 10,
  producto: 'Producto test',
  cantidad: '1',
  cliente: 'Cliente test',
  plataforma: 'MercadoLibre',
};

describe('OrdenesService', () => {
  let service: OrdenesService;
  let repository: Repository<OrdenVenta>;

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDataSource.query
      .mockResolvedValueOnce([mockViewOrden])
      .mockResolvedValueOnce([{ total: 1 }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdenesService,
        {
          provide: getRepositoryToken(OrdenVenta),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrdenesService>(OrdenesService);
    repository = module.get<Repository<OrdenVenta>>(
      getRepositoryToken(OrdenVenta),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated orders from view_ordenes', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([
        expect.objectContaining({
          idOrden: 1,
          idOrdenTienda: 'T-123',
          numeroGuia: 'ML12345',
          estatus: 'PENDIENTE',
          totalOrden: 100000,
          precioFlete: 12000,
          precioCantidad: 88000,
          plataforma: 'MercadoLibre',
          cliente: expect.objectContaining({
            nombreOficial: 'Cliente test',
          }),
          ciudad: expect.objectContaining({
            nombreCiudad: 'Bogota',
            departamento: 'Cundinamarca',
          }),
          transportadora: expect.objectContaining({
            nombre: 'Coordinadora',
          }),
        }),
      ]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('FROM view_ordenes ov'),
        [10, 0],
      );
      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('COUNT(*)::int AS total'),
        [],
      );
    });

    it('should filter by estado from the view', async () => {
      await service.findAll({ page: 1, limit: 10, estatus: 'ENTREGADO' });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('WHERE ov.estado = $1'),
        ['ENTREGADO', 10, 0],
      );
    });

    it('should filter by busqueda against view columns', async () => {
      await service.findAll({ page: 1, limit: 10, busqueda: '123' });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('CAST(ov.id_orden AS TEXT) ILIKE $1'),
        ['%123%', '%123%', '%123%', 10, 0],
      );
    });

    it('should apply filter for guias mayor a 2 dias using the view', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        rangoFechaReporte: 'guias_mayor_a_2_dias',
      });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          "ov.fecha_reporte < CURRENT_TIMESTAMP - INTERVAL '2 days'",
        ),
        [
          'GUIA_GENERADA',
          'ENTREGADO A TRANSPORTADORA',
          'POR RECOLECTAR',
          'ALISTADO',
          'PENDIENTE',
          10,
          0,
        ],
      );
    });

    it('should apply filter for orders between 7 and 15 days using the view', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        rangoFechaReporte: 'entre_7_y_15_dias',
      });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          "ov.fecha_reporte >= CURRENT_TIMESTAMP - INTERVAL '15 days'",
        ),
        [
          'ENTREGADO',
          'DEVOLUCION',
          'CANCELADO',
          'RECHAZADO',
          'GUIA_ANULADA',
          'ANULADO',
          10,
          0,
        ],
      );
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockOrden as OrdenVenta);

      const result = await service.findOne(1);
      expect(result.idOrden).toBe(1);
    });

    it('should throw NotFoundException if order not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
