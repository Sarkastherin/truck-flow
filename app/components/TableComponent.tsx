import React, { useState, useEffect, type JSX, useMemo } from "react";
import * as ReactDataTableComponent from "react-data-table-component";
import type { TableColumn } from "react-data-table-component";
import { Input, Select } from "./InputsForm";
import { Button, ToggleSwitch, useThemeMode } from "flowbite-react";
import { useLocation } from "react-router";
import { useModal } from "~/context/ModalContext";
import { NavLink } from "react-router";
import { ButtonExport, type ExportHeader } from "./ButtonExport";

type DataTableModuleInterop = {
  default:
    | React.ComponentType<Record<string, unknown>>
    | {
        default: React.ComponentType<Record<string, unknown>>;
      };
  createTheme: typeof ReactDataTableComponent.createTheme;
};

const dataTableModule =
  ReactDataTableComponent as unknown as DataTableModuleInterop;
const createTheme = ReactDataTableComponent.createTheme;
const DataTable = (
  "default" in dataTableModule.default
    ? dataTableModule.default.default
    : dataTableModule.default
) as React.ComponentType<Record<string, unknown>>;
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}
type EmptyTableStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};
function EmptyTableState({
  title = "No hay registros todavía",
  description = "Todavía no se cargaron datos para esta sección.",
  actionLabel,
  onAction,
}: EmptyTableStateProps) {
  return (
    <div className="py-10 px-4 text-center text-gray-600 dark:text-gray-300">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4 mx-auto w-max">
          <Button color="violet" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
const getCustomStyles = (isDark: boolean) => ({
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      backgroundColor: isDark ? "#1f2937" : "#f9fafb",
      borderBottomColor: isDark ? "#374151" : "#e5e7eb",
      borderBottomWidth: "1px",
      minHeight: "44px",
    },
  },
  headCells: {
    style: {
      fontWeight: 600,
      fontSize: "12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.02em",
      color: isDark ? "#d1d5db" : "#6b7280",
      paddingTop: "12px",
      paddingBottom: "12px",
    },
  },
  rows: {
    style: {
      backgroundColor: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#f3f4f6" : "#111827",
      borderBottomColor: isDark ? "#374151" : "#e5e7eb",
      borderBottomWidth: "1px",
      minHeight: "52px",
    },
    highlightOnHoverStyle: {
      backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
      transitionDuration: "0.15s",
      transitionProperty: "background-color",
      outlineStyle: "none" as const,
    },
  },
  cells: {
    style: {
      fontSize: "14px",
      color: isDark ? "#f3f4f6" : "#111827",
      paddingTop: "12px",
      paddingBottom: "12px",
    },
  },
  expanderCell: {
    style: {
      color: isDark ? "#d1d5db" : "#4b5563",
    },
  },
  expanderButton: {
    style: {
      color: isDark ? "#f9fafb" : "#374151",
      fill: isDark ? "#f9fafb" : "#374151",
      borderRadius: "6px",
      "&:hover": {
        backgroundColor: isDark ? "#374151" : "#f3f4f6",
        color: isDark ? "#ffffff" : "#111827",
        fill: isDark ? "#ffffff" : "#111827",
      },
      "&:focus": {
        outline: "none",
      },
    },
  },
  pagination: {
    style: {
      backgroundColor: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#d1d5db" : "#374151",
      borderTopColor: isDark ? "#374151" : "#e5e7eb",
      borderTopWidth: "1px",
      minHeight: "52px",
    },
    pageButtonsStyle: {
      borderRadius: "6px",
      color: isDark ? "#f9fafb" : "#374151",
      fill: isDark ? "#f9fafb" : "#374151",
      opacity: 1,
      backgroundColor: "transparent",
      "&:hover:not(:disabled)": {
        backgroundColor: isDark ? "#374151" : "#f3f4f6",
        color: isDark ? "#ffffff" : "#111827",
        fill: isDark ? "#ffffff" : "#111827",
      },
      "&:focus": {
        outline: "none",
      },
      "&:disabled": {
        color: isDark ? "#6b7280" : "#9ca3af",
        fill: isDark ? "#6b7280" : "#9ca3af",
        opacity: 0.8,
      },
    },
  },
});
createTheme("flowbite-dark", {
  background: {
    default: "transparent",
  },
});
createTheme("flowbite-light", {
  background: {
    default: "transparent",
  },
});
export type FilterField = {
  key: string;
  label: string;
  type?: "text" | "select" | "dateRange";
  options?: {
    value: string;
    label: string;
    disabled?: boolean;
  }[];
  emptyOption?: string;
  manualFilter?: boolean; // Si es true, requiere clic en botón Filtrar. Por defecto filtra automáticamente
};

type TableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
  filterFields?: FilterField[];
  onRowClick?: (row: T) => void;
  onFilteredChange?: (filtered: T[]) => void;
  noDataComponent?: JSX.Element;
  inactiveField?: string; // Campo para identificar elementos inactivos (ej: "activo")
  alternativeStorageKey?: string; // Clave alternativa para almacenamiento local
  disableRowClick?: boolean; // Deshabilita el click en filas y el cursor pointer
  expandableRows?: boolean;
  ExpandedComponent?: React.ComponentType<{ data: T }>;
  btnExport?: {
    filename: string;
    headers: ExportHeader[];
    fetchAllData?: () => Promise<Record<string, unknown>[]>;
  };
  btnNavigate?: {
    route: string;
    title: string;
  };
  btnOnClick?: {
    onClick: () => void;
    title: string;
    color?: "blue" | "primary" | "success" | "cyan" | "indigo" | "orange";
  };
  emptyState?: {
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  scrollHeightOffset?: number;
};

type CurrentSort = {
  columnId: string | number | undefined;
  direction: "asc" | "desc";
};
const options = {
  rowsPerPageText: "Filas por página",
  rangeSeparatorText: "de",
};
export function TableComponent<T>({
  data,
  columns,
  filterFields = [],
  onRowClick,
  onFilteredChange,
  noDataComponent,
  inactiveField,
  alternativeStorageKey,
  disableRowClick = false,
  btnExport,
  btnNavigate,
  btnOnClick,
  emptyState,
  scrollHeightOffset,
  expandableRows = false,
  ExpandedComponent,
}: TableProps<T>) {
  const [showInactive, setShowInactive] = useState(false);
  const location = useLocation();
  const { computedMode } = useThemeMode();
  const isDarkMode = computedMode === "dark";
  const tableTheme = isDarkMode ? "flowbite-dark" : "flowbite-light";
  const customStyles = useMemo(() => getCustomStyles(isDarkMode), [isDarkMode]);
  const storageKey =
    alternativeStorageKey || `tableFilters_${location.pathname}`;
  const { openModal, closeModal } = useModal();

  // Función para crear un componente de estado con colores
  const StatusCell = ({
    row,
    originalSelector,
  }: {
    row: T;
    originalSelector: (row: T) => any;
  }) => {
    const status = originalSelector(row);
    const isActive = status === "Activo" || status === "Sí" || status === true;

    return (
      <span
        className={`font-medium text-xs px-2 py-1 rounded-full ${
          isActive
            ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
            : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
        }`}
      >
        {typeof status === "boolean"
          ? status
            ? "Activo"
            : "Inactivo"
          : status}
      </span>
    );
  };
  // Procesar columnas para aplicar formato especial a columnas de estado
  // Procesar columnas para aplicar formato especial a columnas de estado
  const processedColumns = columns.map((column) => {
    // Detectar si es una columna de estado por el nombre
    if (
      (column.name === "Activo" ||
        column.name === "Estado" ||
        column.name === "Status") &&
      column.selector
    ) {
      return {
        ...column,
        cell: (row: T) => (
          <StatusCell row={row} originalSelector={column.selector!} />
        ),
      };
    }
    return column;
  });
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    // Recupera filtros guardados
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });
  const [filteredData, setFilteredData] = useState<T[]>(data);
  const [showFilterInfo, setShowFilterInfo] = useState(false);

  // Estado para la página actual
  const [currentPage, setCurrentPage] = useState<number>(() => {
    // Recupera la página guardada
    const savedPage = localStorage.getItem(`${storageKey}_page`);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  // Estado para el orden actual
  const [currentSort, setCurrentSort] = useState<CurrentSort>(() => {
    // Recupera el orden guardado
    const savedSort = localStorage.getItem(`${storageKey}_sort`);
    return savedSort
      ? JSON.parse(savedSort)
      : { columnId: null, direction: "asc" };
  });

  // Función para determinar si una fila está inactiva
  const isRowInactive = (row: T): boolean => {
    if (!inactiveField) return false;
    const value = getNestedValue(row, inactiveField);
    // Si el campo es booleano, verificamos que sea false
    // Si es string, verificamos valores como "No", "Inactivo", etc.
    return (
      value === false ||
      value === "No" ||
      value === "Inactivo" ||
      value === "no" ||
      value === "false"
    );
  };
  const visibleData = useMemo(() => {
    if (!inactiveField || showInactive) {
      return filteredData;
    }

    return filteredData.filter((row) => !isRowInactive(row));
  }, [filteredData, inactiveField, showInactive]);

  // Función para obtener estilos condicionales de fila
  const getInactiveRowStyles = () => {
    return {
      opacity: "0.6",
      backgroundColor:
        tableTheme === "flowbite-dark"
          ? "rgba(107, 114, 128, 0.1)"
          : "rgba(156, 163, 175, 0.1)",
      borderLeft:
        tableTheme === "flowbite-dark"
          ? "3px solid rgb(107, 114, 128)"
          : "3px solid rgb(156, 163, 175)",
    };
  };
  function removeAccents(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  const onFilter = (newFilters: Record<string, string>) => {
    const result = data.filter((item) =>
      filterFields.every(({ key, type }) => {
        if (type === "dateRange") {
          const from = newFilters[`${key}_from`];
          const to = newFilters[`${key}_to`];
          const itemValue = getNestedValue(item, key);

          if (!itemValue) return false;

          const itemDate = new Date(itemValue).getTime();
          const fromDate = from ? new Date(from).getTime() : null;
          const toDate = to ? new Date(to).getTime() : null;

          return (
            (!fromDate || itemDate >= fromDate) &&
            (!toDate || itemDate <= toDate)
          );
        } else {
          const value = removeAccents(newFilters[key]?.toLowerCase() ?? "");
          const itemValue = removeAccents(
            String(getNestedValue(item, key) ?? "").toLowerCase(),
          );
          return itemValue.includes(value);
        }
      }),
    );
    setFilteredData(result);
    setShowFilterInfo(Object.values(newFilters).some((v) => v));
  };

  const handleChange = (key: string, value: string, manual?: boolean) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated)); // Guarda filtros

    // Resetear a la primera página cuando se aplican filtros
    setCurrentPage(1);
    localStorage.setItem(`${storageKey}_page`, "1");

    if (!manual) onFilter(updated);
  };

  // Función para manejar el cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem(`${storageKey}_page`, page.toString());
  };
  const handleSortChange = (
    column: TableColumn<T>,
    direction: "asc" | "desc",
  ) => {
    setCurrentSort({ columnId: column.id, direction });
    localStorage.setItem(
      `${storageKey}_sort`,
      JSON.stringify({ columnId: column.id, direction }),
    );
  };
  useEffect(() => {
    setFilteredData(data);
    setShowFilterInfo(Object.values(filters).some((v) => v));
  }, [data]);
  useEffect(() => {
    // Aplica filtros guardados al montar si existen
    if (Object.values(filters).some((v) => v)) {
      onFilter(filters);
    } else {
      setFilteredData(data);
    }
    setShowFilterInfo(Object.values(filters).some((v) => v));
  }, [data, filters, onFilteredChange]); // Ejecuta cuando cambia la data o los filtros
  useEffect(() => {
    if (onFilteredChange) {
      onFilteredChange(visibleData);
    }
  }, [onFilteredChange, visibleData]);
  // ...existing code...
  useEffect(() => {
    const isFilter = Object.values(filters).some((v) => v);
    if (isFilter) {
      openModal("confirmation", {
        props: {
          title: "Limpiar filtros",
          message:
            "Hay filtros aplicados desde tu última visita. ¿Deseas limpiar los filtros?",
          confirmText: "Sí, limpiar",
          cancelText: "No, mantener",
          onConfirm: () => {
            setFilters({});
            setFilteredData(data);
            localStorage.removeItem(storageKey);
            localStorage.removeItem(`${storageKey}_page`);
            setShowFilterInfo(false);
            closeModal();
          },
        },
      });
    }
  }, []);
  // Lógica para diferenciar entre sin datos y sin coincidencias
  const noData = data.length === 0;
  const noMatches = data.length > 0 && visibleData.length === 0;

  return (
    <>
      {/* Filtros y switches SIEMPRE visibles si hay campos de filtro y hay datos o hay filtros activos */}
      {filterFields.length > 0 && (!noData || Object.values(filters).some((v) => v)) && (
        <form
          className="flex gap-2 md:flex-row flex-col mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            onFilter(filters);
          }}
        >
          {filterFields.map(
            ({
              key,
              label,
              type = "text",
              options,
              manualFilter,
              emptyOption,
            }) => (
              <div key={key} className="w-full">
                {type === "dateRange" ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      label={`${label} desde`}
                      id={`${key}_from`}
                      type="date"
                      value={filters[`${key}_from`] ?? ""}
                      onChange={(e) =>
                        handleChange(
                          `${key}_from`,
                          e.target.value,
                          manualFilter,
                        )
                      }
                    />
                    <Input
                      label={`${label} hasta`}
                      id={`${key}_to`}
                      type="date"
                      value={filters[`${key}_to`] ?? ""}
                      onChange={(e) =>
                        handleChange(`${key}_to`, e.target.value, manualFilter)
                      }
                    />
                  </div>
                ) : type === "select" ? (
                  <>
                    <Select
                      label={label}
                      id={key}
                      value={filters[key] ?? ""}
                      {...(emptyOption && { emptyOption })}
                      onChange={(e) =>
                        handleChange(key, e.target.value, manualFilter)
                      }
                      options={
                        options?.map((op) => ({
                          value: op.value,
                          label: op.label,
                        })) || []
                      }
                    />
                  </>
                ) : (
                  <Input
                    label={label}
                    id={key}
                    type="search"
                    value={filters[key] ?? ""}
                    onChange={(e) =>
                      handleChange(key, e.target.value, manualFilter)
                    }
                  />
                )}
              </div>
            ),
          )}
          {filterFields.some((f) => f.manualFilter) && (
            <Button color="yellow" type="submit">
              Filtrar
            </Button>
          )}
        </form>
      )}

      {/* Switch de inactivos y resumen de filtros solo si hay datos */}
      {data.length > 0 && visibleData.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          {inactiveField && (
            <div className="mb-4 flex items-center gap-2">
              <ToggleSwitch
                checked={showInactive}
                onChange={setShowInactive}
                label="Mostrar inactivos"
              />
            </div>
          )}
          {showFilterInfo && filterFields.length > 0 && (
            <div className="flex justify-between w-full items-center text-sm font-semibold">
              <div className="text-blue-600 dark:text-blue-400 ">
                ℹ️ Filtros aplicados.
              </div>
              <div className="mt-2 bg-zinc-300/50 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 px-2 rounded">
                Registros encontrados: {visibleData.length}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <DataTable
          columns={processedColumns}
          data={visibleData}
          customStyles={customStyles}
          theme={tableTheme}
          pagination
          paginationPerPage={30}
          paginationDefaultPage={currentPage}
          onChangePage={handlePageChange}
          onRowClicked={!disableRowClick ? onRowClick : undefined}
          pointerOnHover={!disableRowClick}
          highlightOnHover
          paginationComponentOptions={options}
          onSort={handleSortChange}
          defaultSortFieldId={currentSort.columnId}
          defaultSortAsc={currentSort.direction === "asc"}
          expandableRows={expandableRows}
          expandableRowsComponent={ExpandedComponent}
          fixedHeader
          {...(scrollHeightOffset && {
            fixedHeaderScrollHeight: `calc(100vh - ${scrollHeightOffset}px)`,
          })}
          noDataComponent={
            noDataComponent || (
              <EmptyTableState
                title={
                  noData
                    ? emptyState?.title || "No hay registros cargados"
                    : noMatches
                    ? "No hay coincidencias para los filtros"
                    : emptyState?.title || "No se encontraron registros"
                }
                description={
                  noData
                    ? emptyState?.description || "Todavía no se cargaron datos para esta sección."
                    : noMatches
                    ? "Intenta modificar o limpiar los filtros para ver resultados."
                    : emptyState?.description
                }
                actionLabel={emptyState?.actionLabel || btnOnClick?.title}
                onAction={emptyState?.onAction || btnOnClick?.onClick}
              />
            )
          }
          conditionalRowStyles={
            inactiveField
              ? [
                  {
                    when: (row: T) => isRowInactive(row),
                    style: getInactiveRowStyles(),
                  },
                ]
              : undefined
          }
        />
      </div>
      {(btnExport || btnNavigate || btnOnClick) && (
        <span className="fixed bottom-0 left-0 w-full">
          <div
            className={`flex justify-between w-full  py-3 px-8 hover:bg-gray-200 hover:dark:bg-gray-950`}
          >
            {btnExport && (
              <ButtonExport
                data={visibleData as Record<string, unknown>[]}
                filename={btnExport.filename}
                headers={btnExport.headers}
                fetchAllData={btnExport.fetchAllData}
              />
            )}

            {btnNavigate && (
              <NavLink to={btnNavigate.route}>
                <Button color={"indigo"}>{btnNavigate.title}</Button>
              </NavLink>
            )}
            {btnOnClick && (
              <Button
                size="sm"
                className="ms-auto"
                color={btnOnClick.color || "default"}
                onClick={btnOnClick.onClick}
              >
                {btnOnClick.title}
              </Button>
            )}
          </div>
        </span>
      )}
    </>
  );
}
