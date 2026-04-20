import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'snapshot_ordenes_por_ejecucion', synchronize: false })
export class SnapshotOrdenesPorEjecucion {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: string;

  @Column({ name: 'log_cargue_id', type: 'integer' })
  logCargueId: number;

  @Column({ name: 'fecha_snapshot', type: 'date' })
  fechaSnapshot: string;

  @Column({ name: 'plataforma', type: 'text' })
  plataforma: string;

  @Column({ name: 'total_entre_7_15', type: 'integer', default: 0 })
  totalEntre715: number;

  @Column({ name: 'total_entre_15_20', type: 'integer', default: 0 })
  totalEntre1520: number;

  @Column({ name: 'total_mayor_20', type: 'integer', default: 0 })
  totalMayor20: number;

  @Column({
    name: 'total_guias_mayor_a_2_dias',
    type: 'integer',
    default: 0,
  })
  totalGuiasMayorA2Dias: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
  createdAt: Date;
}
