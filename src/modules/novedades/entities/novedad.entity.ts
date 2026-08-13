import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrdenVenta } from '../../ordenes/entities/orden-venta.entity';
import { CategoriaNovedad } from '../../categorias-novedad/entities/categoria-novedad.entity';
import { HistorialNovedad } from './historial-novedad.entity';
import { EstadoNovedad } from '../../../common/enums';

@Entity({ name: 'novedad' })
export class Novedad {
  @PrimaryGeneratedColumn({ name: 'id_novedad' })
  idNovedad: number;

  @Column({ name: 'id_orden' })
  idOrden: number;

  @Column({ name: 'id_categoria' })
  idCategoria: number;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 20,
    default: EstadoNovedad.ABIERTA,
  })
  estado: EstadoNovedad;

  @Column({ name: 'usuario_registro', type: 'varchar', length: 150 })
  usuarioRegistro: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @ManyToOne(() => OrdenVenta)
  @JoinColumn({ name: 'id_orden' })
  orden?: OrdenVenta;

  @ManyToOne(() => CategoriaNovedad, (cat) => cat.novedades)
  @JoinColumn({ name: 'id_categoria' })
  categoria: CategoriaNovedad;

  @OneToMany(() => HistorialNovedad, (hist) => hist.novedad)
  historial: HistorialNovedad[];
}
