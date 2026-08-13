import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Novedad } from './novedad.entity';

@Entity({ name: 'historial_novedad' })
export class HistorialNovedad {
  @PrimaryGeneratedColumn({ name: 'id_historial' })
  idHistorial: number;

  @Column({ name: 'id_novedad' })
  idNovedad: number;

  @Column({ name: 'accion', type: 'varchar', length: 50 })
  accion: string;

  @Column({ name: 'estado_anterior', type: 'varchar', length: 20, nullable: true })
  estadoAnterior: string;

  @Column({ name: 'estado_nuevo', type: 'varchar', length: 20, nullable: true })
  estadoNuevo: string;

  @Column({ name: 'detalle', type: 'text', nullable: true })
  detalle: string;

  @Column({ name: 'usuario', type: 'varchar', length: 150 })
  usuario: string;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;

  @ManyToOne(() => Novedad, (novedad) => novedad.historial)
  @JoinColumn({ name: 'id_novedad' })
  novedad: Novedad;
}
