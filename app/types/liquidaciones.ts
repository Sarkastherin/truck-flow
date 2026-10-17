import type { CommonTypes } from "./commonTypes";
import type { Employee } from "./rrhh";
export type StatusLiquidacion = "nueva" | "en_proceso" | "cerrada";
export const optionsStatusLiq: { value: StatusLiquidacion; label: string }[] = [
  { value: "nueva", label: "Nueva" },
  { value: "en_proceso", label: "En proceso" },
  { value: "cerrada", label: "Cerrada" },
];
export type Fichada = CommonTypes & {
  fecha: string;
  liquidacion_id: string;
  empleado_id: string;
  entrada: string;
  salida: string | null;
  /* Derivados — recalculados al vuelo; opcionales por legacy en hojas viejas */
  total_horas?: number;
  horas_regular?: number;
  horas_extras?: number;
  active: boolean;
};
export type Reporte = CommonTypes & {
  empleado_id: string;
  liquidacion_id: string;
  premio_id: string;
  cantidad: number;
  pedido_id?: string;
};

export type Liquidacion = CommonTypes & {
  desde: string;
  hasta: string;
  status: StatusLiquidacion;
  horas_semanales: number | null;
  dias_lluvia: string | null;
  dias_no_laborables: string | null;
  fichada?: Fichada[];
  reporte?: Reporte[];
};
export type LiquidacionResumen = {
  empleado: Employee;
  fichadas: Fichada[];
  reportes: Reporte[];
  /* Horas */
  horas_totales: number;
  total_horas_regulares: number;
  total_horas_extras: number;
  monto_salario_regular: number;
  monto_salario_extra: number;
  /* Cumplimiento */
  dias_laborables: number;
  faltas: number;
  tardanzas: number;
  salidas_tempranas: number;
  dias_incumplidos: number;
  /* Premios (grupo Cacho: régimen de carrocerías; resto: monto simple) */
  carrocerias: number;
  monto_carrocerias: number;
  premios_perdidos: number;
  premios_ganados: number;
  premio_recuperado: number;
  otros_premios: number;
  monto_premio: number;
};
export type ReporteFormValues = Omit<Reporte, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
export type LiquidacionFormValues = Omit<Liquidacion, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
