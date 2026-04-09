import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenesController } from './ordenes.controller';
import { OrdenesService } from './ordenes.service';
import {
  OrdenVenta,
  DetalleOrden,
  Cliente,
  Ciudad,
  Transportadora,
  Producto,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenVenta,
      DetalleOrden,
      Cliente,
      Ciudad,
      Transportadora,
      Producto,
    ]),
  ],
  controllers: [OrdenesController],
  providers: [OrdenesService],
  exports: [OrdenesService],
})
export class OrdenesModule {}
