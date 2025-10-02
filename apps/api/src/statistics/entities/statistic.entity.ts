import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("statistics")
export class Statistic {
  @PrimaryColumn({ type: "date" })
  date: string; // YYYY-MM-DD

  @Column({ type: "int", default: 0 })
  dailySignups: number;

  @Column({ type: "int", default: 0 })
  dailyMatches: number;

  @Column({ type: "int", default: 0 })
  totalUsers: number;

  @Column({ type: "int", default: 0 })
  totalMatches: number;
}
