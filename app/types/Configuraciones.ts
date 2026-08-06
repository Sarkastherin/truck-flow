import type { CommonTypes } from "./commonTypes";

export type Carrozado = CommonTypes & {
  nombre: string;
  imagen_url: string;
};
export type Color = CommonTypes & {
  nombre: string;
  tipo: "esmalte" | "lona";
};
export type PuertaTrasera = CommonTypes & {
  nombre: string;
};
export type TipoTrabajo = CommonTypes & {
  nombre: string;
};
export type Personal = CommonTypes & {
  nombre: string;
  apellido: string;
  sector: string;
};
export type ItemControl = CommonTypes & {
  nombre: string;
  atributo_relacionado: string;
  control: "carrozado";
};
export type ValorPredefinido = CommonTypes & {
  carrozado_id: string;
  atributo: string;
  valor: string;
  tipo: "fijo" | "seleccionable";
};
export type ValoresPredefinidosFormValues = Omit<
  ValorPredefinido,
  keyof CommonTypes
> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
};
export type ControlCarrozado = CommonTypes & {
  carrozado_id: string;
  item_control_id: string;
  item_control: ItemControl;
  order?: number;
};
export type ControlCalidadFormValues = Omit<
  ControlCarrozado,
  keyof CommonTypes | "item_control"
> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
};
