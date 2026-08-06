import type { CommonTypes } from "./commonTypes";

export type SocioComercial = CommonTypes & {
  tipo: "cliente" | "proveedor";
  razon_social: string;
  cuit_cuil: string;
  nombre_contacto: string;
  email_contacto: string;
  telefono_contacto: string;
  direccion: string;
  localidad_id: string;
  localidad: string;
  provincia_id: string;
  provincia: string;
  condicion_iva: string;
  vendedor_id: string;
  notas?: string;
};
export type SocioComercialFormValues = Omit<
  SocioComercial,
  keyof CommonTypes
> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
export interface Provincia {
  id: string;
  nombre: string;
  nombre_completo: string;
  fuente: string;
  categoria: string;
  centroide: {
    lat: number;
    lon: number;
  };
  iso_id: string;
  iso_nombre: string;
}
export interface Localidades {
  id: string;
  nombre: string;
  fuente: string;
  provincia: { id: string; nombre: string };
  departamento: { id: string; nombre: string };
  gobierno_local: { id: string; nombre: string };
  localidad_censal: { id: string; nombre: string };
  categoria: string;
  centroide: {
    lat: number;
    lon: number;
  };
}