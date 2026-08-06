import type { SheetCellValue, SheetRows } from "./apiGoogleSheets";
type SheetMatrix = SheetRows;

export const getDataInJSONFormat = <T extends Record<string, unknown>>(
  rows: SheetMatrix,
): T[] => {
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) =>
    String(header ?? "")
      .trim()
      .toLowerCase(),
  ) as Array<keyof T & string>;

  const result = dataRows.map((row) => {
    const item: Partial<T> = {};
    const typedItem = item as Record<keyof T & string, unknown>;

    headers.forEach((header, index) => {
      typedItem[header] = row[index];
    });

    return item as T;
  });
  return result.filter((item) => item.id !== undefined && item.id !== null) as T[];
};
const getDataInArray = (
  data: Record<string, unknown>,
  headers: SheetCellValue[],
): SheetCellValue[] => {
  const result: SheetCellValue[] = [];
  for (let i = 0; i < headers.length; i++) {
    const item = headers[i];
    if (data.hasOwnProperty(item as string)) {
      result[i] = data[item as string] as SheetCellValue;
    } else {
      result[i] = "";
    }
  }
  return result;
};
export function formatDateUStoES(value?: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
export function prepareDataToCreate<T extends Record<string, unknown>>(
  data: T,
  created_by: string,
  headers: SheetCellValue[],
) {
  const id = crypto.randomUUID();
  const now = new Date();
  const created_at = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const updated_at = created_at;
  const updated_by = created_by;
  const active = true;

  const completedData = {
    id,
    created_at,
    created_by,
    updated_at,
    updated_by,
    active,
    ...data,
  };
  return getDataInArray(completedData, headers);
}
export function prepareDataToUpdate(
  data: any,
  row: number,
  sheetName: string,
  headers: SheetCellValue[],
  updated_by: string,
) {
  const now = new Date();
  const updated_at = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const completedData = {
    updated_at,
    updated_by,
    ...data,
  };
  const { id, ...rest } = completedData;
  let payload = [];
  for (var item in rest) {
    const index = headers.indexOf(item);
    if (index !== -1) {
      const payloadItem: {
        range: string;
        values: SheetCellValue[][];
      } = {} as any;
      const notation = `${sheetName}!R${row}C${index + 1}`;
      payloadItem.range = notation;
      payloadItem.values = [[rest[item] as SheetCellValue]];
      payload.push(payloadItem);
    }
  }
  return payload;
}
// Fuera del componente
export const findRowById = (
  id: string,
  sheetName: string,
  dataFromSheets: Record<string, SheetCellValue[][]>,
  nameColId:string
): number | null => {
  if (!dataFromSheets) {
    console.error(
      "No se pueden buscar índices: los datos de las hojas no están cargados.",
    );
    return null;
  }
  const sheetData = dataFromSheets[sheetName];
  if (!sheetData) {
    console.error(`No se encontraron datos para la hoja ${sheetName}.`);
    console.error("Datos disponibles:", sheetData);
    return null;
  }
  const colIndex = sheetData[0].findIndex(item => item === nameColId);
  const index = sheetData.findIndex((row) => row[colIndex] === id);
  return index !== -1 ? index + 1 : null;
};

export const findAllRowsById = (
  id: string,
  sheetName: string,
  dataFromSheets: Record<string, SheetCellValue[][]>,
  nameColId: string
): number[] => {
  if (!dataFromSheets) return [];
  const sheetData = dataFromSheets[sheetName];
  if (!sheetData) return [];
  const colIndex = sheetData[0].findIndex(item => item === nameColId);
  return sheetData
    .map((row, index) => (row[colIndex] === id ? index + 1 : null))
    .filter((row): row is number => row !== null);
};
