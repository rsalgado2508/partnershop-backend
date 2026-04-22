import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Ciudad } from './ciudad.entity';
import { Transportadora } from './transportadora.entity';
import { DetalleOrden } from './detalle-orden.entity';
import { Novedad } from 'src/modules/novedades/entities/novedad.entity';

@Entity({ name: 'orden_venta', synchronize: false })
export class OrdenVenta {
  @PrimaryColumn({ name: 'id_orden' })
  idOrden: number;

  @Column({ name: 'id_cliente' })
  idCliente: number;

  @Column({ name: 'id_ciudad' })
  idCiudad: number;

  @Column({ name: 'id_transportadora', nullable: true })
  idTransportadora: number;

  @Column({ name: 'estatus', nullable: true })
  estatus: string;

  @Column({ name: 'fecha_reporte', type: 'date', nullable: true })
  fechaReporte: Date;

  @Column({ name: 'total_orden', type: 'numeric', nullable: true })
  totalOrden: number;

  @Column({ name: 'precio_cantidad', type: 'numeric', nullable: true })
  precioCantidad: number;

  @Column({ name: 'precio_flete', type: 'numeric', nullable: true })
  precioFlete: number;

  @Column({ name: 'ganancia', type: 'numeric', nullable: true })
  ganancia: number;

  @Column({ name: 'numero_guia', nullable: true })
  numeroGuia: string;

  @Column({ name: 'plataforma', nullable: true })
  plataforma: string;

  @Column({ name: 'responsable_venta', nullable: true })
  responsableVenta: string;

  @Column({ name: 'id_orden_tienda', nullable: true })
  idOrdenTienda: string;

  @Column({ name: 'referencia_movimiento', nullable: true })
  referenciaMovimiento: string;

  @Column({ name: 'fecha_creacion', type: 'timestamp', nullable: true })
  fechaCreacion: Date;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Ciudad)
  @JoinColumn({ name: 'id_ciudad' })
  ciudad: Ciudad;

  novedad: Novedad | null;

  @ManyToOne(() => Transportadora)
  @JoinColumn({ name: 'id_transportadora' })
  transportadora: Transportadora;

  @OneToMany(() => DetalleOrden, (detalle) => detalle.orden)
  detalles: DetalleOrden[];
}
