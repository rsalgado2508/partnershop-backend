import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasNovedadController } from './categorias-novedad.controller';
import { CategoriasNovedadService } from './categorias-novedad.service';
import { CategoriaNovedad } from './entities/categoria-novedad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaNovedad])],
  controllers: [CategoriasNovedadController],
  providers: [CategoriasNovedadService],
  exports: [CategoriasNovedadService],
})
export class CategoriasNovedadModule {}
