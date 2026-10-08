import Papa from "papaparse";
import { z } from "zod";
import {
  FICHADA_DATA_COLUMN_COUNT,
  FICHADA_HEADERS,
  FICHADA_PIE_INICIAL,
  type FichadaFile,
  type ImportError,
  type ImportFichadasResult,
} from "~/types/fichadas";

type RawRow = { cells: string[]; line: number };

const FECHA_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const SERIAL_REGEX = /^\d+(\.\d+)?$/;
const HORA_REGEX = /^\d{1,2}:\d{2}$/;
const DNI_REGEX = /^\d{7,8}$/;
const PIE_PAGINA_REGEX = /^P[áa]gina\s+-?\d+\s+de\s+\d+$/i;

function serialToDate(serial: number): Date {
  const utc = new Date(Math.round((serial - 25569) * 86400000));
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
  );
}

function parseFecha(value: string): Date | null {
  const trimmed = value.trim();

  const match = trimmed.match(FECHA_REGEX);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    const seconds = match[6] ? Number(match[6]) : 0;
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    const isValid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date.getHours() === hours &&
      date.getMinutes() === minutes;
    return isValid ? date : null;
  }

  if (SERIAL_REGEX.test(trimmed)) {
    const serial = Number(trimmed);
    if (serial >= 1 && serial <= 2958465) {
      return serialToDate(serial);
    }
  }

  return null;
}

const fichadaRowSchema = z.object({
  fecha: z.string().refine((value) => parseFecha(value) !== null, {
    message: "Fecha inválida: se espera dd/MM/yyyy HH:mm:ss.",
  }),
  hora: z.string().refine((value) => HORA_REGEX.test(value), {
    message: "Hora inválida: se espera HH:mm.",
  }),
  evento: z.string().refine((value) => value.length > 0, {
    message: "Evento vacío.",
  }),
  idFichada: z.string().refine((value) => DNI_REGEX.test(value), {
    message: "idFichada inválido: se esperan 7 u 8 dígitos.",
  }),
  persona: z.string().refine((value) => value.length > 0, {
    message: "Persona vacía.",
  }),
  sector: z.string().refine((value) => value === "", {
    message: "SECTOR debe venir vacío.",
  }),
  empresaVisita: z.string().refine((value) => value === "", {
    message: "EmpresaVisita debe venir vacío.",
  }),
  visitado: z.string().refine((value) => value === "", {
    message: "Visitado debe venir vacío.",
  }),
  registrador: z.string().refine((value) => value.length > 0, {
    message: "Registrador vacío.",
  }),
});

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function decodeText(buffer: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("windows-1252").decode(buffer);
  }
  return text.replace(/^﻿/, "");
}

async function readCsvRows(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const text = decodeText(buffer);
  const parsed = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: false,
  });
  return parsed.data.map((row) => row.map((cell) => cell ?? ""));
}

async function readXlsxRows(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  return rows.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => cellToString(cell)),
  );
}

export async function readFileToRows(file: File): Promise<string[][]> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "xlsx" || extension === "xls") {
    return readXlsxRows(file);
  }
  if (extension === "csv" || extension === "txt") {
    return readCsvRows(file);
  }
  throw new Error(
    `Formato no soportado: ".${extension}". Usá archivos .csv o .xlsx.`,
  );
}

function trimTrailingEmptyCells(cells: string[]): string[] {
  const result = [...cells];
  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }
  return result;
}

function toDataCells(cells: string[]): string[] | null {
  const extras = cells.slice(FICHADA_DATA_COLUMN_COUNT);
  if (extras.some((cell) => cell !== "")) return null;
  const result = cells.slice(0, FICHADA_DATA_COLUMN_COUNT);
  while (result.length < FICHADA_DATA_COLUMN_COUNT) {
    result.push("");
  }
  return result;
}

function cellsToObject(cells: string[]) {
  return {
    fecha: cells[0] ?? "",
    hora: cells[1] ?? "",
    evento: cells[2] ?? "",
    idFichada: cells[3] ?? "",
    persona: cells[4] ?? "",
    sector: cells[5] ?? "",
    empresaVisita: cells[6] ?? "",
    visitado: cells[7] ?? "",
    registrador: cells[8] ?? "",
  };
}

export function validateFichadasRows(rawRows: string[][]): ImportFichadasResult {
  const errors: ImportError[] = [];

  const rows: RawRow[] = rawRows
    .map((cells, index) => ({
      cells: cells.map((cell) => (cell ?? "").trim()),
      line: index + 1,
    }))
    .filter((row) => row.cells.some((cell) => cell !== ""))
    .map((row) => ({ ...row, cells: trimTrailingEmptyCells(row.cells) }));

  if (rows.length < 3) {
    errors.push({
      row: 0,
      message:
        "El archivo debe contener encabezados, al menos una fila de datos y el pie de página.",
    });
    return { ok: false, data: [], errors };
  }

  const header = rows[0];
  if (header.cells.length !== FICHADA_HEADERS.length) {
    errors.push({
      row: header.line,
      message: `Encabezados: se esperaban ${FICHADA_HEADERS.length} columnas y se encontraron ${header.cells.length}.`,
    });
  } else {
    FICHADA_HEADERS.forEach((expected, index) => {
      const found = header.cells[index];
      if (found !== expected) {
        errors.push({
          row: header.line,
          message: `Encabezado columna ${index + 1}: se esperaba "${expected}" y se encontró "${found || "(vacío)"}".`,
        });
      }
    });
  }

  const footer = rows[rows.length - 1];
  if (footer.cells.length !== 4) {
    errors.push({
      row: footer.line,
      message: `Pie de página: se esperaban 4 columnas y se encontraron ${footer.cells.length}.`,
    });
  }
  if (footer.cells[0] !== FICHADA_PIE_INICIAL) {
    errors.push({
      row: footer.line,
      message: `Pie de página: se esperaba que comenzara con "${FICHADA_PIE_INICIAL}".`,
    });
  }
  if (!PIE_PAGINA_REGEX.test(footer.cells[footer.cells.length - 1] ?? "")) {
    errors.push({
      row: footer.line,
      message: 'Pie de página: se esperaba que terminara con "Página -N de N".',
    });
  }

  const data: FichadaFile[] = [];
  const dataRows = rows.slice(1, rows.length - 1);
  for (const row of dataRows) {
    const cells = toDataCells(row.cells);
    if (!cells) {
      errors.push({
        row: row.line,
        message: `Fila con más de ${FICHADA_DATA_COLUMN_COUNT} columnas con datos.`,
      });
      continue;
    }

    const parsed = fichadaRowSchema.safeParse(cellsToObject(cells));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({ row: row.line, message: issue.message });
      }
      continue;
    }

    const fecha = parseFecha(parsed.data.fecha);
    if (!fecha) {
      errors.push({
        row: row.line,
        message: "Fecha inválida: se espera dd/MM/yyyy HH:mm:ss.",
      });
      continue;
    }

    data.push({
      fecha,
      hora: parsed.data.hora,
      evento: parsed.data.evento,
      idFichada: parsed.data.idFichada,
      persona: parsed.data.persona,
      sector: parsed.data.sector,
      empresaVisita: parsed.data.empresaVisita,
      visitado: parsed.data.visitado,
      registrador: parsed.data.registrador,
    });
  }

  const ok = errors.length === 0;
  return { ok, data: ok ? data : [], errors };
}

export async function importFichadasFile(
  file: File,
): Promise<ImportFichadasResult> {
  const rows = await readFileToRows(file);
  return validateFichadasRows(rows);
}
