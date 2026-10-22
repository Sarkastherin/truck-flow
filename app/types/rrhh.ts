import type { CommonTypes } from "./commonTypes";
export const formatDni = (dni: string | number) => {
  const dniString = String(dni);
  const first = dniString.slice(0, 2);
  const second = dniString.slice(2, 5);
  const third = dniString.slice(5, 8);
  return `${first}.${second}.${third}`;
};
export type TipoPago = "Porcentaje" | "Salario semanal" | "Salario mensual";

export const optionsTipoPago: { value: TipoPago; label: string }[] = [
  { value: "Porcentaje", label: "Porcentaje" },
  { value: "Salario semanal", label: "Salario semanal" },
  { value: "Salario mensual", label: "Salario mensual" },
];
export type AreasType =
  | "soldador"
  | "colocacion"
  | "pintura"
  | "arquero"
  | "electricidad"
  | "administrativo"
  | "mantenimiento"
  | "plegador";
export const optionsAreas: { value: AreasType; label: string }[] = [
  { value: "soldador", label: "Soldador" },
  { value: "colocacion", label: "Colocación" },
  { value: "pintura", label: "Pintura" },
  { value: "arquero", label: "Arquero" },
  { value: "electricidad", label: "Electricidad" },
  { value: "administrativo", label: "Administrativo" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "plegador", label: "Plegador" },
];
export type SeguroType =
  | "fed_patronal"
  | "la_segunda"
  | "prevencion"
  | "aseguradora_ap";
export const optionsSeguro: { value: SeguroType; label: string }[] = [
  { value: "fed_patronal", label: "FED. PATRONAL" },
  { value: "la_segunda", label: "LA SEGUNDA" },
  { value: "prevencion", label: "PREVENCIÓN" },
  { value: "aseguradora_ap", label: "ASEGURADO AP" },
];
export type VehiculoType =
  | "moto"
  | "auto"
  | "camioneta"
  | "bicicleta"
  | "no_aplica";
export const optionsvehiculo: { value: VehiculoType; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "moto", label: "Moto" },
  { value: "camioneta", label: "Camioneta" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "no_aplica", label: "No aplica" },
];
export const optionSector: { value: SectorTypes; label: string }[] = [
  { value: "control", label: "Control" },
  { value: "fabricacion", label: "Fabricación" },
  { value: "pintura", label: "Pintura" },
  { value: "plegado", label: "Plegado" },
];
export type GrupoEmployee = "Cacho" | "No aplica";
export type Employee = CommonTypes & {
  nombre_completo: string;
  dni: string | number;
  tipo_pago: TipoPago;
  valor_salario_semanal: number | null;
  valor_hora_regular: number | null;
  valor_hora_extra: number | null;
  grupo: GrupoEmployee | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  direccion: string | null;
  area?: AreasType;
  seguro: SeguroType | null;
  tiene_carnet: boolean;
  vehiculo: VehiculoType | string;
  alergias: boolean;
  tipo_alergia: string | null;
  contacto_emergencia: string | null;
  siniestros: string | null;
  talle_camisa: number | null;
  talle_pantalon: number | null;
  talle_borcegos: number | null;
  talle_remera: string | null;
};
export type EmployeeFormValues = Omit<Employee, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
export type SectorTypes =
  | "pintura"
  | "fabricacion"
  | "plegado"
  | "control"
  | "no_definido";
export type TipoType = "carroceria" | "accesorios";
export type Premios = CommonTypes & {
  nombre: string;
  precio: number;
  sector?: SectorTypes;
  tipo?: TipoType;
};
export type PremiosFormValues = Omit<Premios, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
export type MvtoEmpleados = CommonTypes & {
  empleado_id: string;
  fecha_movimiento: string;
  tipo_movimiento: "deuda" | "pago";
  concepto: string;
  debe: number;
  haber: number;
};
export type MvtoEmpleadosFormValues = Omit<MvtoEmpleados, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
export type CtaCteEmpleados = {
  empleado: Employee;
  debe: number;
  haber: number;
  isClosed: boolean;
  active: boolean;
} & {
  movimientos: MvtoEmpleados[];
};
