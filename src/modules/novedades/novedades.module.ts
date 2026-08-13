import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NovedadesController } from './novedades.controller';
import { NovedadesService } from './novedades.service';
import { Novedad } from './entities/novedad.entity';
import { HistorialNovedad } from './entities/historial-novedad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Novedad, HistorialNovedad])],
  controllers: [NovedadesController],
  providers: [NovedadesService],
  exports: [NovedadesService],
})
export class NovedadesModule {}
