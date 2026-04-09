import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'transportadora', synchronize: false })
export class Transportadora {
  @PrimaryColumn({ name: 'id_transportadora' })
  idTransportadora: number;

  @Column({ name: 'nombre' })
  nombre: string;
}
