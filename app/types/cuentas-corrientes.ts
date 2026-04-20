import type { CommonTypes } from "./commonTypes";
import type { SocioComercial } from "./socios";
export const optionMediosPago = [
  { value: "efectivo", label: "Efectivo", tipoMovimiento: ["pago"] },
  { value: "transferencia", label: "Transferencia", tipoMovimiento: ["pago"] },
  { value: "cheque", label: "Cheque", tipoMovimiento: ["pago"] },
  {
    value: "carroceria_usada",
    label: "Carrocería usada",
    tipoMovimiento: ["pago"],
  },
  {
    value: "no_aplica",
    label: "No aplica",
    tipoMovimiento: ["deuda", "nota_credito"],
  },
];
export const optionsTipoMovimiento = [
  { value: "deuda", label: "Deuda" },
  { value: "pago", label: "Pago" },
  { value: "nota_credito", label: "Nota crédito" },
];
export const optionsTipoCheque = [
  { value: "fisico", label: "Físico" },
  { value: "echeq", label: "Echeq" },
];
export const statusOptionsCheques: { value: ChequeStatus; label: string }[] = [
  { value: "en_cartera", label: "Recibido" },
  { value: "depositado", label: "Depositado" },
  { value: "acreditado", label: "Acreditado" },
  { value: "endosado", label: "Endosado" },
  { value: "anulado", label: "Anulado" },
  { value: "rechazado", label: "Rechazado" },
];
export type ChequeStatus =
  | "en_cartera"
  | "depositado"
  | "acreditado"
  | "endosado"
  | "anulado"
  | "rechazado";

export type TipoMovimiento = (typeof optionsTipoMovimiento)[number]["value"];
export type MedioPago = (typeof optionMediosPago)[number]["value"];
export type TipoCheque = (typeof optionsTipoCheque)[number]["value"];

export type Movimientos = CommonTypes & {
  cliente_id: string;
  fecha_movimiento: string;
  tipo_movimiento: TipoMovimiento;
  origen:
    | "pedido"
    | "manual"
    | "cheque"
    | "rechazo_cheque"
    | "anulacion_movimiento";
  medio_pago: MedioPago;
  referencia?: string;
  concepto?: string;
  debe: number;
  haber: number;
};
export type ChequeFormValues = Omit<
  Cheque,
  keyof CommonTypes | "tipo" | "importe" | "cliente" | "movimiento"
> & {
  tipo: TipoCheque | "";
  importe: number | undefined;
};

export type MovimientoFormValues = Omit<
  MovimientoDetalle,
  | keyof CommonTypes
  | "tipo_movimiento"
  | "medio_pago"
  | "debe"
  | "haber"
  | "cheques"
  | "documentos"
> & {
  tipo_movimiento: TipoMovimiento | "";
  medio_pago: MedioPago | "";
  debe: number | undefined;
  haber: number | undefined;
  cheques: ChequeFormValues[];
  documentos: Documento[];
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  numero_pedido?: string;
};
export type Cheque = CommonTypes & {
  movimiento_id: string;
  tipo: TipoCheque;
  banco?: string;
  numero: number | undefined;
  importe: number;
  fecha_ingreso: string;
  fecha_cobro: string;
  status: ChequeStatus;
  fecha_deposito?: string;
  fecha_acreditacion?: string;
  fecha_endoso?: string;
  proveedor_id?: string;
  fecha_anulacion?: string;
  motivo_anulacion?: string;
  fecha_rechazo?: string;
  motivo_rechazo?: string;
  notas?: string;
};
export type ChequeConSociosYMovimiento = CommonTypes &
  Cheque & {
    proveedor?: SocioComercial;
    cliente: SocioComercial;
    movimiento: Movimientos;
  };
export type Documento = CommonTypes & {
  movimiento_id: string;
  nombre: string;
  tipo_documento: "movimiento";
  url: string;
};
export type DocumentoFormValues = Omit<Documento, keyof CommonTypes>;
export type MovimientoDetalle = Movimientos & {
  cheques?: Cheque[];
  documentos?: Documento[];
};
export type CtaCte = {
  cliente: SocioComercial;
  debe: number;
  haber: number;
  isClosed: boolean;
} & {
  movimientos: MovimientoDetalle[];
};
