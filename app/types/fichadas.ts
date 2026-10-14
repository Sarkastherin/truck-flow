import type { CommonTypes } from "./commonTypes";
import type { Fichada } from "./liquidaciones";
import type { Employee } from "./rrhh";
export type FichadaFile = {
  fecha: Date;
  hora: string;
  evento: string;
  idFichada: string;
  persona: string;
  sector: string;
  empresaVisita: string;
  visitado: string;
  registrador: string;
};

export type FichadaFileAgrupada = {
  fecha: Date;
  dniEmpleado: string;
  entrada: string;
  salida: string | null;
  totalHorasTrabajadas: number;
  horasRegular: number
  horasExtras: number
  active: boolean
};

export type FichadasFileUI = FichadaFileAgrupada & {
  empleado: Employee | undefined;
  id?: string;
};

export type FichadaFormValues = Omit<Fichada, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
export type ImportError = {
  row: number;
  message: string;
};

export type ImportFichadasResult = {
  ok: boolean;
  data: FichadaFile[];
  errors: ImportError[];
};

export const FICHADA_HEADERS = [
  "Fecha / hora",
  "Evento",
  "idFichada",
  "Persona",
  "SECTOR",
  "EmpresaVisita",
  "Visitado",
  "Registrador",
] as const;

export const FICHADA_DATA_COLUMN_COUNT = 9;
export const FICHADA_PIE_INICIAL = "Fecha de emision";
