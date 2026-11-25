import { Button } from "flowbite-react";
import type {
  TableColumn,
  UseTableExportOptions,
} from "react-data-table-component";
import { FaCopy, FaDownload } from "react-icons/fa6";

type Delimiter = "," | ";";

type Props<T> = UseTableExportOptions<T> & {
  nameFile?: string;
  delimiter?: Delimiter;
};

function escapeCsvValue(value: string, delimiter: Delimiter): string {
  const shouldQuote =
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes('"') ||
    value.includes(delimiter);

  if (!shouldQuote) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function formatNumberEs(value: number | bigint): string {
  return String(value).replace(".", ",");
}

function stringifyValue(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return formatNumberEs(value);
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}

function getHeaderLabel<T>(
  column: TableColumn<T>,
  headerOverrides?: Record<string | number, string>,
): string {
  if (
    column.id != null &&
    headerOverrides &&
    headerOverrides[column.id] !== undefined
  ) {
    return headerOverrides[column.id];
  }
  if (typeof column.name === "string" || typeof column.name === "number") {
    return String(column.name);
  }
  if (column.id != null) {
    return String(column.id);
  }
  return "";
}

function getExportColumns<T>(
  columns: TableColumn<T>[],
  columnOrder?: (string | number)[],
): TableColumn<T>[] {
  const visible = columns.filter((column) => !column.omit);

  if (!columnOrder) {
    return visible;
  }

  const byId = new Map<string | number, TableColumn<T>>();
  visible.forEach((column) => {
    if (column.id != null) {
      byId.set(column.id, column);
    }
  });

  return columnOrder
    .map((id) => byId.get(id))
    .filter((column): column is TableColumn<T> => column !== undefined);
}

function buildCsv<T>(
  options: UseTableExportOptions<T>,
  delimiter: Delimiter,
): string {
  const {
    columns,
    rows,
    valueSource = "selector",
    headerOverrides,
    columnOrder,
  } = options;
  const exportColumns = getExportColumns(columns, columnOrder);

  const headerLine = exportColumns
    .map((column) =>
      escapeCsvValue(getHeaderLabel(column, headerOverrides), delimiter),
    )
    .join(delimiter);

  const bodyLines = rows.map((row, rowIndex) =>
    exportColumns
      .map((column) => {
        const value =
          valueSource === "format" && column.format
            ? column.format(row, rowIndex)
            : column.selector?.(row, rowIndex);
        return escapeCsvValue(stringifyValue(value), delimiter);
      })
      .join(delimiter),
  );

  return [headerLine, ...bodyLines].join("\r\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function ButtonDownload<T>({
  columns,
  rows,
  nameFile,
  delimiter = ";",
  valueSource = "selector",
  headerOverrides,
  columnOrder,
}: Props<T>) {
  return (
    <Button
      size="sm"
      color={"alternative"}
      onClick={() =>
        downloadCsv(
          buildCsv(
            { columns, rows, valueSource, headerOverrides, columnOrder },
            delimiter,
          ),
          `${nameFile}.csv`,
        )
      }
    >
      <FaDownload className="me-1.5" />
      Descargar
    </Button>
  );
}

export function ButtonCopy<T>({
  columns,
  rows,
  delimiter = ";",
  valueSource = "selector",
  headerOverrides,
  columnOrder,
}: Props<T>) {
  return (
    <Button
      size="sm"
      color={"alternative"}
      onClick={() => {
        void navigator.clipboard.writeText(
          buildCsv(
            { columns, rows, valueSource, headerOverrides, columnOrder },
            delimiter,
          ),
        );
      }}
    >
      <FaCopy className="me-1.5" />
      Copiar
    </Button>
  );
}
