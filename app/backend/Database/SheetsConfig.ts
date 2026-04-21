export const MODE_DEV = import.meta.env.MODE === "development";
export const SHEET_NAMES_PEDIDOS = {
  pedidos: "pedidos",
  formas_pago: "formas_pago",
  camiones: "camiones",
  carroceria: "carroceria",
  trabajo_chasis: "trabajo_chasis",
  ordenes_trabajo: "ordenes_trabajo",
  documentos: "documentos",
};
export const SHEET_NAMES_CONFIGURACIONES = {
  carrozados: "carrozados",
  colores: "colores",
  puertas_traseras: "puertas_traseras",
  tipos_trabajos: "tipos_trabajos",
  personal: "personal",
  items_control: "items_control",
  valores_predefinidos: "valores_predefinidos",
  control_carrozado: "control_carrozado",
};
export const SHEET_NAMES_SOCIOS = {
  socios_comerciales: "socios_comerciales",
};
export const SHEET_NAMES_CTAS_CORRIENTES = {
  movimientos: "movimientos",
  cheques: "cheques",
  documentos: "documentos",
}

export const SHEET_ID_PEDIDO =
  MODE_DEV
    ? import.meta.env.VITE_SHEET_ID_PEDIDOS_DEV
    : import.meta.env.VITE_SHEET_ID_PEDIDOS;
export const SHEET_ID_CONFIGURACIONES =
  MODE_DEV
    ? import.meta.env.VITE_SHEET_ID_CONFIGURACIONES_DEV
    : import.meta.env.VITE_SHEET_ID_CONFIGURACIONES;
export const SHEET_ID_SOCIOS =
  MODE_DEV
    ? import.meta.env.VITE_SHEET_ID_SOCIOS_DEV
    : import.meta.env.VITE_SHEET_ID_SOCIOS;
export const SHEET_ID_CTAS_CORRIENTES =
  MODE_DEV
    ? import.meta.env.VITE_SHEET_ID_CTAS_CORRI_DEV
    : import.meta.env.VITE_SHEET_ID_CTAS_CORRI;
export const getCompleteSheetRange = (sheetNames: Record<string, string>) =>
  Object.values(sheetNames).map((name) => `${name}!A:ZZZ`);


