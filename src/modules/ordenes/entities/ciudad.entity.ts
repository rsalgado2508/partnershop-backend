import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ciudad', synchronize: false })
export class Ciudad {
  @PrimaryColumn({ name: 'id_ciudad' })
  idCiudad: number;

  @Column({ name: 'nombre_ciudad' })
  nombreCiudad: string;

  @Column({ name: 'departamento', nullable: true })
  departamento: string;
}
