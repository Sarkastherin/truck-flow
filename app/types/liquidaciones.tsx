import type { CommonTypes } from "./commonTypes";
export type StatusLiquidacion = "nueva" | "en_proceso" | "cerrada";
export const optionsStatusLiq: { value: StatusLiquidacion; label: string }[] = [
  { value: "nueva", label: "Nueva" },
  { value: "en_proceso", label: "En proceso" },
  { value: "cerrada", label: "Cerrada" },
];
export type Fichada = CommonTypes & {
  fecha: string;
  empleado_id: string;
  entrada: string;
  salida: string | null;
  total_horas: number;
  horas_regular: number;
  horas_extras: number;
  active: boolean;
};
export type Reporte = CommonTypes & {};
export type Liquidacion = CommonTypes & {
  desde: string;
  hasta: string;
  status: StatusLiquidacion;
  fichada?: Fichada[];
  reporte?: Reporte[];
};
export type LiquidacionFormValues = Omit<Liquidacion, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
