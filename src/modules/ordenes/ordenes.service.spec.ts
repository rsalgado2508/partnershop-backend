import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { OrdenVenta, Transportadora } from './entities';

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
  novedad_id_novedad: 55,
  novedad_id_categoria: 3,
  novedad_descripcion: 'Cliente no responde',
  novedad_estado: 'ABIERTA',
  novedad_usuario_registro: 'tester',
  novedad_fecha_registro: '2026-04-21T10:00:00.000Z',
  novedad_fecha_actualizacion: '2026-04-21T11:00:00.000Z',
  novedad_categoria_nombre: 'CLIENTE',
  novedad_categoria_descripcion: 'Novedad asociada al cliente',
  novedad_categoria_activo: true,
  novedad_categoria_fecha_creacion: '2026-04-01T00:00:00.000Z',
};

describe('OrdenesService', () => {
  let service: OrdenesService;
  let repository: Repository<OrdenVenta>;
  let transportadoraRepository: Repository<Transportadora>;

  const mockDataSource = {
    query: jest.fn(),
    getRepository: jest.fn(),
  };

  const mockNovedadRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDataSource.query
      .mockResolvedValueOnce([mockViewOrden])
      .mockResolvedValueOnce([{ total: 1 }]);
    mockDataSource.getRepository.mockReturnValue(mockNovedadRepository);
    mockNovedadRepository.findOne.mockResolvedValue({
      idNovedad: 55,
      idOrden: 1,
      idCategoria: 3,
      descripcion: 'Cliente no responde',
      estado: 'ABIERTA',
      usuarioRegistro: 'tester',
      fechaRegistro: new Date('2026-04-21T10:00:00.000Z'),
      fechaActualizacion: new Date('2026-04-21T11:00:00.000Z'),
      categoria: {
        idCategoria: 3,
        nombre: 'CLIENTE',
      },
    });

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
          provide: getRepositoryToken(Transportadora),
          useValue: {
            find: jest.fn(),
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
    transportadoraRepository = module.get<Repository<Transportadora>>(
      getRepositoryToken(Transportadora),
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
          novedad: expect.objectContaining({
            idNovedad: 55,
            descripcion: 'Cliente no responde',
            categoria: expect.objectContaining({
              idCategoria: 3,
              nombre: 'CLIENTE',
            }),
          }),
          detalles: [
            expect.objectContaining({
              idOrden: 1,
              idProducto: 10,
              cantidad: 1,
              producto: expect.objectContaining({
                idProducto: 10,
                nombreOficial: 'Producto test',
              }),
            }),
          ],
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
          'INDEMNIZACIÓN PAGADA',
          'INDEMNIZADA',
          'INDEMNIZADA POR DROPI',
          'INDEMNIZADA POR PARTNERSHOP',
          10,
          0,
        ],
      );
    });

    it('should filter by latest novedad category', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        idCategoriaNovedad: 3,
      });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('ult_nov.id_categoria = $1'),
        [3, 10, 0],
      );
      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('ult_nov.id_categoria = $1'),
        [3],
      );
    });

    it('should filter by transportadora name', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        transportadora: 'Coord',
      });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('ov.transportadora ILIKE $1'),
        ['%Coord%', 10, 0],
      );
    });

    it('should filter by explicit fecha reporte range', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        fechaReporteDesde: '2026-05-01',
        fechaReporteHasta: '2026-05-22',
      });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('ov.fecha_reporte >= $1::date'),
        ['2026-05-01', '2026-05-22', 10, 0],
      );
      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          "ov.fecha_reporte < ($2::date + INTERVAL '1 day')",
        ),
        ['2026-05-01', '2026-05-22', 10, 0],
      );
    });

    it('should sort by the latest comment across the paginated result', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        ordenarPor: 'ultimoComentario',
        direccion: 'desc',
      });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          'ORDER BY ult_nov.fecha_registro DESC NULLS LAST, ov.id_orden DESC',
        ),
        [10, 0],
      );
    });

    it('should invert fecha reporte direction when sorting by open days', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        ordenarPor: 'diasAbierto',
        direccion: 'asc',
      });

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          'ORDER BY ov.fecha_reporte DESC NULLS LAST, ov.id_orden DESC',
        ),
        [10, 0],
      );
    });
  });

  describe('findTransportadoras', () => {
    it('should return transportadoras ordered by name', async () => {
      jest
        .spyOn(transportadoraRepository, 'find')
        .mockResolvedValue([{ idTransportadora: 1, nombre: 'Coordinadora' }]);

      const result = await service.findTransportadoras();

      expect(result).toEqual([{ idTransportadora: 1, nombre: 'Coordinadora' }]);
      expect(transportadoraRepository.find).toHaveBeenCalledWith({
        order: { nombre: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockOrden as OrdenVenta);

      const result = await service.findOne(1);
      expect(result.idOrden).toBe(1);
      expect(mockNovedadRepository.findOne).toHaveBeenCalledWith({
        where: { idOrden: 1 },
        relations: ['categoria'],
        order: { fechaRegistro: 'DESC', idNovedad: 'DESC' },
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
