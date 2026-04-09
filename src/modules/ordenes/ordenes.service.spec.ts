import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

describe('OrdenesService', () => {
  let service: OrdenesService;
  let repository: Repository<OrdenVenta>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockOrden], 1]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdenesService,
        {
          provide: getRepositoryToken(OrdenVenta),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
          },
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
    it('should return paginated orders', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should apply estatus filter', async () => {
      await service.findAll({ page: 1, limit: 10, estatus: 'ENTREGADO' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'orden.estatus = :estatus',
        { estatus: 'ENTREGADO' },
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
