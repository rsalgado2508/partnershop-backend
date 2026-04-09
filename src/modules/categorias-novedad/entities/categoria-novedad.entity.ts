import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Novedad } from '../../novedades/entities/novedad.entity';

@Entity({ name: 'categoria_novedad' })
export class CategoriaNovedad {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  idCategoria: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @OneToMany(() => Novedad, (novedad) => novedad.categoria)
  novedades: Novedad[];
}
