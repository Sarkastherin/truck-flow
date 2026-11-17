import type { CommonTypes } from "./commonTypes";
import type { Employee, MvtoEmpleados } from "./rrhh";
export type StatusLiquidacion = "nueva" | "completada";
export const optionsStatusLiq: { value: StatusLiquidacion; label: string }[] = [
  { value: "nueva", label: "Nueva" },
  { value: "completada", label: "Completada" },
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
  bono_quincenal:boolean;
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
  horas_trabajadas: number;
  horas_feriado: number;
  horas_extras: number;
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
  monto_premio: number;
  deuda: number;
  descuento: number;
  mvtoDescuento?: MvtoEmpleados[];
  saldo: number;
  active: boolean;
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

export type LiquidacionHistorial = {
  id: string;
  created_at: string;
  empleado_id: string;
  liquidacion_id: string;
  hs_totales: number;
  hs_feriado: number;
  hs_pagadas: number;
  hs_regulares: number;
  hs_extras: number;
  salario: number;
  extra: number;
  carrocerias: number;
  faltas: number;
  tardanzas: number;
  sal_temprano: number;
  perdidos: number;
  ganados: number;
  recuperados: number;
  total_premios: number;
  deuda: number;
  descuento: number;
  saldo: number;
  total: number;
  created_by: string;
  updated_by: string;
  updated_at: string;
  active: boolean;
};

export type LiquidacionHistorialInput = Omit<
  LiquidacionHistorial,
  "id" | "created_at" | "created_by" | "updated_at" | "updated_by" | "active"
> & { id?: string };
