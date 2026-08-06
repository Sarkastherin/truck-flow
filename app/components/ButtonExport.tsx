import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";

type ExportRow = Record<string, unknown>;

export type ExportHeader = {
  label: string;
  key: string;
  type?: "number";
};

type ButtonExportProps = {
  data?: ExportRow[];
  headers: ExportHeader[];
  filename: string;
  fetchAllData?: () => Promise<ExportRow[]>;
};

const formatNumberForCSV = (value: number) => String(value).replace(".", ",");

function getNestedValue(row: ExportRow, path: string): unknown {
  return path.split(".").reduce<unknown>((accumulator, part) => {
    if (typeof accumulator !== "object" || accumulator === null) {
      return undefined;
    }

    return (accumulator as Record<string, unknown>)[part];
  }, row);
}

function processRows(rows: ExportRow[], headers: ExportHeader[]) {
  return rows.map((row) => {
    const newRow: Record<string, string> = {};

    headers.forEach((header) => {
      const rawValue = getNestedValue(row, header.key);

      if (header.type === "number" && rawValue !== undefined && rawValue !== null) {
        newRow[header.label] = formatNumberForCSV(Number(rawValue));
        return;
      }

      newRow[header.label] = rawValue == null ? "" : String(rawValue);
    });

    return newRow;
  });
}

function escapeCsvValue(value: string, separator: "," | ";"): string {
  const shouldQuote = value.includes("\n") || value.includes("\r") || value.includes('"') || value.includes(separator);
  if (!shouldQuote) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsvContent(rows: Record<string, string>[], headers: ExportHeader[], separator: "," | ";") {
  const headerLine = headers.map((header) => escapeCsvValue(header.label, separator)).join(separator);
  const dataLines = rows.map((row) =>
    headers
      .map((header) => escapeCsvValue(row[header.label] ?? "", separator))
      .join(separator),
  );

  return [headerLine, ...dataLines].join("\n");
}

function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export const ButtonExport = ({
  data,
  headers,
  filename,
  fetchAllData,
}: ButtonExportProps) => {
  const [separator, setSeparator] = useState<"," | ";">(";");
  const [loading, setLoading] = useState(false);

  const exportRows = async () => {
    if (fetchAllData) {
      return fetchAllData();
    }

    return Array.isArray(data) ? data : [];
  };

  const handleExport = async () => {
    setLoading(true);

    try {
      const allRows = await exportRows();
      const processedData = processRows(allRows, headers);
      const csvContent = buildCsvContent(processedData, headers, separator);

      downloadCsvFile(csvContent, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-sm inline-flex divide-x divide-gray-300 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="bg-green-600 text-white px-3 py-1.5 font-medium hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
      >
        {loading && <AiOutlineLoading className="animate-spin" />}
        Exportar
      </button>
      <div className="relative">
        <select
          className="dark:bg-gray-800 appearance-none w-full h-full px-3 py-1.5 text-gray-700 dark:text-gray-200 bg-transparent pr-8 focus:outline-none cursor-pointer"
          onChange={(e) => setSeparator(e.target.value as "," | ";")}
          value={separator}
        >
          <option disabled>Separador</option>
          <option value=",">coma [,]</option>
          <option value=";">punto y coma [;]</option>
        </select>

        {/* Ícono de flecha */}
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg
            className="h-4 w-4 text-gray-500 dark:text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
