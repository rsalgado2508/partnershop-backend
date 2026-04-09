import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { OrdenVenta } from './orden-venta.entity';
import { Producto } from './producto.entity';

@Entity({ name: 'detalle_orden', synchronize: false })
export class DetalleOrden {
  @PrimaryColumn({ name: 'id_detalle' })
  idDetalle: number;

  @Column({ name: 'id_orden' })
  idOrden: number;

  @Column({ name: 'id_producto' })
  idProducto: number;

  @Column({ name: 'cantidad' })
  cantidad: number;

  @ManyToOne(() => OrdenVenta, (orden) => orden.detalles)
  @JoinColumn({ name: 'id_orden' })
  orden: OrdenVenta;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;
}
