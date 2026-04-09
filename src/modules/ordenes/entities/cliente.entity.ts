import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'cliente', synchronize: false })
export class Cliente {
  @PrimaryColumn({ name: 'id_cliente' })
  idCliente: number;

  @Column({ name: 'nombre_oficial', nullable: true })
  nombreOficial: string;

  @Column({ name: 'telefono', nullable: true })
  telefono: string;

  @Column({ name: 'email', nullable: true })
  email: string;

  @Column({ name: 'tipo_identificacion', nullable: true })
  tipoIdentificacion: string;

  @Column({ name: 'numero_identificacion', nullable: true })
  numeroIdentificacion: string;
}
