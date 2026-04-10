import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NovedadesService } from './novedades.service';
import { Novedad } from './entities/novedad.entity';
import { HistorialNovedad } from './entities/historial-novedad.entity';
import { EstadoNovedad } from '../../common/enums';
import { CognitoUser } from '../../common/decorators/current-user.decorator';

const mockUser: CognitoUser = {
  sub: 'user-123',
  email: 'test@test.com',
  username: 'testuser',
  groups: ['OPERADOR'],
};

const mockNovedad: Partial<Novedad> = {
  idNovedad: 1,
  idOrden: 100,
  idCategoria: 1,
  descripcion: 'Producto dañado',
  estado: EstadoNovedad.ABIERTA,
  usuarioRegistro: 'testuser',
  fechaRegistro: new Date(),
};

describe('NovedadesService', () => {
  let service: NovedadesService;
  let novedadRepo: Repository<Novedad>;
  let historialRepo: Repository<HistorialNovedad>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockNovedad], 1]),
  };

  const mockManager = {
    create: jest.fn().mockImplementation((_, data) => data),
    findOne: jest.fn().mockResolvedValue(mockNovedad),
    save: jest.fn().mockImplementation((entity) => ({
      ...entity,
      idNovedad: 1,
    })),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NovedadesService,
        {
          provide: getRepositoryToken(Novedad),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(HistorialNovedad),
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

    service = module.get<NovedadesService>(NovedadesService);
    novedadRepo = module.get<Repository<Novedad>>(
      getRepositoryToken(Novedad),
    );
    historialRepo = module.get<Repository<HistorialNovedad>>(
      getRepositoryToken(HistorialNovedad),
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated novedades', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply estado filter', async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        estado: EstadoNovedad.ABIERTA,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'novedad.estado = :estado',
        { estado: EstadoNovedad.ABIERTA },
      );
    });
  });

  describe('findOne', () => {
    it('should return a novedad by id', async () => {
      jest
        .spyOn(novedadRepo, 'findOne')
        .mockResolvedValue(mockNovedad as Novedad);

      const result = await service.findOne(1);
      expect(result.idNovedad).toBe(1);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(novedadRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create novedad and historial within a transaction', async () => {
      const result = await service.create(
        { idOrden: 100, idCategoria: 1, descripcion: 'Producto dañado' },
        mockUser,
      );

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledTimes(2);
      expect(mockManager.findOne).toHaveBeenCalledWith(Novedad, {
        where: { idNovedad: 1 },
        relations: ['categoria', 'orden', 'orden.cliente'],
      });
      expect(novedadRepo.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockNovedad);
    });
  });

  describe('updateEstado', () => {
    it('should use the transaction manager to load and return the novedad', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(mockNovedad)
        .mockResolvedValueOnce({
          ...mockNovedad,
          estado: EstadoNovedad.CERRADA,
        });

      const result = await service.updateEstado(
        1,
        { estado: EstadoNovedad.CERRADA },
        mockUser,
      );

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenNthCalledWith(1, Novedad, {
        where: { idNovedad: 1 },
        relations: ['categoria', 'orden', 'orden.cliente'],
      });
      expect(mockManager.findOne).toHaveBeenNthCalledWith(2, Novedad, {
        where: { idNovedad: 1 },
        relations: ['categoria', 'orden', 'orden.cliente'],
      });
      expect(novedadRepo.findOne).not.toHaveBeenCalled();
      expect(result.estado).toBe(EstadoNovedad.CERRADA);
    });
  });

  describe('findHistorial', () => {
    it('should return historial for a novedad', async () => {
      jest
        .spyOn(novedadRepo, 'findOne')
        .mockResolvedValue(mockNovedad as Novedad);
      jest
        .spyOn(historialRepo, 'find')
        .mockResolvedValue([{ idHistorial: 1, accion: 'CREACION' } as any]);

      const result = await service.findHistorial(1);
      expect(result).toHaveLength(1);
    });
  });
});
