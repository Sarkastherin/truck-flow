import type { CommonTypes } from "./commonTypes";
import type { SocioComercial } from "./socios";
export const statusOptionsCarroceriaUsada = [
  { value: "disponible", label: "Disponible" },
  { value: "vendida", label: "Vendida" },
  { value: "prestada", label: "Prestada" },
];
export type StatusCarroceriaUsada = "disponible" | "vendida" | "prestada";
export type CarroceriaUsada = CommonTypes & {
  pedido_id?: string;
  precio_lista?: number | null;
  tasacion: number;
  duenno_id: string;
  fecha_recepcion?: string;
  condicion?: string;
  notas?: string;
  marca_carroceria?: string;
  anno_fabricacion?: number | null;
  marca_camion?: string;
  modelo_camion?: string;
  status: StatusCarroceriaUsada;
  numero_carroceria: string;
  /* Datos y caracteristicas */
  tipo_carrozado: string;
  tipo_carrozado_otro?: string;
  largo?: number | null;
  alto?: number | null;
  ancho?: number | null;
  alt_baranda?: number | null;
  tipo_piso?: string;
  color?: string;
  material?: string;
  ptas_por_lado?: number | null;
  puerta_trasera?: string;
  arcos_por_puerta?: string;
  tipos_arcos?: string;
  corte_guardabarros: boolean;
  cumbreras: boolean;
  tipo_zocalo?: string;
  lineas_refuerzo?: string | null;
  /* cuchetin */
  cuchetin: boolean;
  med_cuchetin: number | null;
  alt_pta_cuchetin: number | null;
  alt_techo_cuchetin: number | null;
  notas_cuchetin?: string;
  tipo_larguero?: string;
  med_larguero?: string

  /* Accesorios */
  luces?: number | null;
  guardabarros?: boolean;
  dep_agua?: boolean;
  ubicacion_dep_agua?: string;
  cintas_reflectivas?: string;
  /* Accesorios - Boquillas */
  boquillas?: number | null;
  tipo_boquillas?: string;
  /* Accesorios - Cajon de herramientas */
  med_cajon_herramientas?: number | null;
  ubicacion_cajon_herramientas?: string;
  /* Alargue */
  alargue_tipo_1?: "baranda a cumbrera" | "N/A" | "";
  cant_alargue_1?: number | null;
  med_alargue_1?: number | null;
  quiebre_alargue_1?: boolean;
  alargue_tipo_2?: "sobre cumbrera" | "N/A" | "";
  cant_alargue_2?: number | null;
  med_alargue_2?: number | null;
  quiebre_alargue_2?: boolean;
};
export type Fotos = CommonTypes & {
  carroceria_usada_id: string;
  url: string;
  public_id: string;
  width: number;
  height: number;
};

export type CarroceriaUsadaData = CarroceriaUsada & {
  duenno: SocioComercial | null;
  fotos: Fotos[] | []; // Array de URLs de las fotos
  prestamo: PrestamoCarroceria | null;
};

export type PrestamoCarroceria = CommonTypes & {
  carroceria_usada_id: string;
  cliente_id: string;
  pedido_id?: string;
  fecha_prestamo: string;
  fecha_devolucion_estimada: string;
  notas_prestamo?: string;
  notas_devolucion?: string;
  fecha_devolucion?: string;
};
