import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriasNovedadService } from './categorias-novedad.service';
import { CategoriaNovedad } from './entities/categoria-novedad.entity';

const mockCategoria: Partial<CategoriaNovedad> = {
  idCategoria: 1,
  nombre: 'Daño en producto',
  descripcion: 'Producto llegó dañado',
  activo: true,
  fechaCreacion: new Date(),
};

describe('CategoriasNovedadService', () => {
  let service: CategoriasNovedadService;
  let repository: Repository<CategoriaNovedad>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasNovedadService,
        {
          provide: getRepositoryToken(CategoriaNovedad),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriasNovedadService>(CategoriasNovedadService);
    repository = module.get<Repository<CategoriaNovedad>>(
      getRepositoryToken(CategoriaNovedad),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockCategoria as CategoriaNovedad);
      jest.spyOn(repository, 'save').mockResolvedValue(mockCategoria as CategoriaNovedad);

      const result = await service.create({ nombre: 'Daño en producto' });
      expect(result.nombre).toBe('Daño en producto');
    });

    it('should throw ConflictException if name exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCategoria as CategoriaNovedad);

      await expect(
        service.create({ nombre: 'Daño en producto' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return active categories', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockCategoria as CategoriaNovedad]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete (deactivate) a category', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCategoria as CategoriaNovedad);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockCategoria,
        activo: false,
      } as CategoriaNovedad);

      await service.remove(1);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ activo: false }),
      );
    });
  });
});
