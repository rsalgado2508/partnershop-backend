import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaNovedad } from './entities/categoria-novedad.entity';
import { CreateCategoriaNovedadDto } from './dto/create-categoria-novedad.dto';
import { UpdateCategoriaNovedadDto } from './dto/update-categoria-novedad.dto';

@Injectable()
export class CategoriasNovedadService {
  constructor(
    @InjectRepository(CategoriaNovedad)
    private readonly categoriaRepository: Repository<CategoriaNovedad>,
  ) {}

  async create(dto: CreateCategoriaNovedadDto): Promise<CategoriaNovedad> {
    const exists = await this.categoriaRepository.findOne({
      where: { nombre: dto.nombre },
    });

    if (exists) {
      throw new ConflictException(
        `Ya existe una categoría con el nombre "${dto.nombre}"`,
      );
    }

    const categoria = this.categoriaRepository.create(dto);
    return this.categoriaRepository.save(categoria);
  }

  async findAll(): Promise<CategoriaNovedad[]> {
    return this.categoriaRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CategoriaNovedad> {
    const categoria = await this.categoriaRepository.findOne({
      where: { idCategoria: id },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }

  async update(
    id: number,
    dto: UpdateCategoriaNovedadDto,
  ): Promise<CategoriaNovedad> {
    const categoria = await this.findOne(id);

    if (dto.nombre && dto.nombre !== categoria.nombre) {
      const exists = await this.categoriaRepository.findOne({
        where: { nombre: dto.nombre },
      });
      if (exists) {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${dto.nombre}"`,
        );
      }
    }

    Object.assign(categoria, dto);
    return this.categoriaRepository.save(categoria);
  }

  async remove(id: number): Promise<void> {
    const categoria = await this.findOne(id);
    categoria.activo = false;
    await this.categoriaRepository.save(categoria);
  }
}
