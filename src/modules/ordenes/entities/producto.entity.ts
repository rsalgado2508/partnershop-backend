import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'producto', synchronize: false })
export class Producto {
  @PrimaryColumn({ name: 'id_producto' })
  idProducto: number;

  @Column({ name: 'nombre_oficial' })
  nombreOficial: string;
}
