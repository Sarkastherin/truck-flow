import DataTable, {
  type TableColumn,
  type TableProps,
  type ConditionalStyles,
  type ThemeProp,
  type FilterState,
  createTheme,
  isFilterActive,
  useColumnVisibility,
} from "react-data-table-component";
import {
  useThemeMode,
  Button,
  Spinner,
  ToggleSwitch,
  TextInput,
  Dropdown,
  DropdownItem,
  DropdownHeader,
  DropdownDivider,
} from "flowbite-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { MdAddChart, MdViewColumn } from "react-icons/md";
import { SubTitles } from "./SubTitles";
import { Badge } from "flowbite-react";
import { useModal } from "~/context/ModalContext";
export type ColorsTypes =
  | "pink"
  | "green"
  | "blue"
  | "indigo"
  | "default"
  | "primary"
  | "lime"
  | "yellow";

type TableComponentProps<T> = TableProps<T> & {
  columns: TableColumn<T>[];
  onAddRecord?: () => void;
  isLoading: boolean;
  labelButton: string;
  title?: string;
  backPath: string;
  color: ColorsTypes;
  scrollHeightOffset?: number;
  searchKeys?: ReadonlyArray<string>;
  searchPlaceholder?: string;
  hasActiveColumn?: boolean;
  btnAction?: {
    onClick: () => void;
    label: string;
    disabled?: boolean;
  };
  conditionalRowStyles?: ConditionalStyles<T>[];
  customTheme?: any;
  message?: string | React.ReactNode | React.ReactElement;
  showColumnVisibility?: boolean;
  persistFilters?: boolean;
  promptOnMount?: boolean;
  storageKey?: string;
};
function NoDataComponent({
  label = "Nuevo registro",
  onAddRecord,
  color = "default",
}: {
  label?: string;
  onAddRecord?: () => void;
  color: ColorsTypes;
}) {
  return (
    <div className="text-center space-y-4 p-6 text-base-600 dark:text-base-300">
      <p>
        No hay registros cargados para mostrar. <br />
        Agrega el primer registro aquí
      </p>
      <Button className="mx-auto" color={color} onClick={onAddRecord}>
        <MdAddChart className="me-2 w-5 h-5" />
        {label}
      </Button>
    </div>
  );
}

const getSearchValue = (row: unknown, key: string): unknown =>
  key
    .split(".")
    .reduce(
      (value, part) =>
        (value as Record<string, unknown> | null | undefined)?.[part],
      row,
    );

const DEFAULT_ROWS_PER_PAGE = 30;

type TableSortState = {
  columnId: string | number | null;
  direction: string;
};

type PersistedTableState = {
  filters: Record<string, FilterState>;
  search: string;
  page: number;
  rowsPerPage: number;
  sort: TableSortState | null;
  hiddenColumns: (string | number)[];
};

function readPersistedState(key: string | null): PersistedTableState | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedTableState> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      filters:
        parsed.filters && typeof parsed.filters === "object"
          ? parsed.filters
          : {},
      search: typeof parsed.search === "string" ? parsed.search : "",
      page: typeof parsed.page === "number" && parsed.page > 0 ? parsed.page : 1,
      rowsPerPage:
        typeof parsed.rowsPerPage === "number" && parsed.rowsPerPage > 0
          ? parsed.rowsPerPage
          : DEFAULT_ROWS_PER_PAGE,
      sort: parsed.sort ?? null,
      hiddenColumns: Array.isArray(parsed.hiddenColumns)
        ? parsed.hiddenColumns
        : [],
    };
  } catch {
    return null;
  }
}

function writePersistedState(key: string | null, state: PersistedTableState) {
  if (!key || typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // storage lleno o no disponible
  }
}

function removePersistedState(key: string | null) {
  if (!key || typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // storage no disponible
  }
}

function isFilterMeaningful(filter: FilterState): boolean {
  if (filter.values !== undefined) {
    if (!filter.knownValues) return filter.values.length > 0;
    return filter.values.some((value) => !filter.knownValues!.includes(value));
  }
  return isFilterActive(filter);
}

export default function TableComponent<T extends { active?: boolean }>({
  columns,
  data,
  onAddRecord,
  isLoading,
  labelButton,
  title,
  backPath,
  color,
  scrollHeightOffset,
  searchKeys,
  searchPlaceholder = "Buscar...",
  hasActiveColumn = true,
  btnAction,
  conditionalRowStyles = [],
  customTheme = {},
  message,
  showColumnVisibility = false,
  persistFilters = true,
  promptOnMount,
  storageKey: storageKeyProp,
  onChangePage,
  onChangeRowsPerPage,
  onSort,
  ...props
}: TableComponentProps<T>) {
  const stateActiveColumn: TableColumn<T>[] | [] = hasActiveColumn
    ? [
        {
          id: "activo",
          name: "Activo",
          cell: (row) => (
            <Badge color={row.active !== false ? "green" : "red"}>
              {row.active !== false ? "Sí" : "No"}
            </Badge>
          ),
          selector: (row) => (row.active ? "Sí" : "No"),
          filterable: true,
          filterType: "set",
          width: "100px",
        },
      ]
    : [];
  const { computedMode } = useThemeMode();
  const isDarkMode = computedMode === "dark";
  const tableTheme = isDarkMode ? "dark" : "light";
  const location = useLocation();
  const { openModal, closeModal } = useModal();
  const storageKey = persistFilters
    ? (storageKeyProp ?? `tableState_${location.pathname}`)
    : null;
  const shouldPrompt = promptOnMount ?? persistFilters;
  const persisted = useMemo(() => readPersistedState(storageKey), [storageKey]);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState(() => persisted?.search ?? "");
  const [filterValues, setFilterValues] = useState<Record<string, FilterState>>(
    () => persisted?.filters ?? {},
  );
  const [currentPage, setCurrentPage] = useState<number>(
    () => persisted?.page ?? 1,
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    () => persisted?.rowsPerPage ?? DEFAULT_ROWS_PER_PAGE,
  );
  const [currentSort, setCurrentSort] = useState<TableSortState | null>(
    () => persisted?.sort ?? null,
  );
  const hiddenColumnIds = useMemo(
    () => new Set((persisted?.hiddenColumns ?? []).map(String)),
    [persisted],
  );
  const inactiveCount = data.filter((row) => !row.active).length;
  const query = search.trim().toLowerCase();
  const visibleData = data
    .filter((row) => !hasActiveColumn || showInactive || row.active !== false)
    .filter((row) => {
      if (!query) return true;
      if (searchKeys) {
        return searchKeys.some((key) =>
          String(getSearchValue(row, key) ?? "")
            .toLowerCase()
            .includes(query),
        );
      }
      return columns.some(
        (col) =>
          col.selector &&
          String(col.selector(row) ?? "")
            .toLowerCase()
            .includes(query),
      );
    });
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    columnId: string | number,
    filter: FilterState,
  ) => {
    setFilterValues((prev) => ({ ...prev, [columnId]: filter }));
    setCurrentPage(1);
  };

  const handlePageChange: NonNullable<TableProps<T>["onChangePage"]> = (
    page,
    totalRows,
  ) => {
    setCurrentPage(page);
    onChangePage?.(page, totalRows);
  };

  const handleRowsPerPageChange: NonNullable<
    TableProps<T>["onChangeRowsPerPage"]
  > = (currentRowsPerPage, page) => {
    setRowsPerPage(currentRowsPerPage);
    setCurrentPage(page);
    onChangeRowsPerPage?.(currentRowsPerPage, page);
  };

  const handleSort: NonNullable<TableProps<T>["onSort"]> = (
    selectedColumn,
    sortDirection,
    sortedRows,
    sortColumns,
  ) => {
    setCurrentSort({
      columnId: selectedColumn?.id ?? null,
      direction: sortDirection,
    });
    onSort?.(selectedColumn, sortDirection, sortedRows, sortColumns);
  };

  const clearFilters = () => {
    setFilterValues({});
    setSearch("");
    setCurrentPage(1);
    setShowInactive(false);
  };

  const baseColumns = hasActiveColumn
    ? [...columns, ...stateActiveColumn]
    : columns;
  const processColumn =
    hiddenColumnIds.size === 0
      ? baseColumns
      : baseColumns.map((column) =>
          column.id != null && hiddenColumnIds.has(String(column.id))
            ? { ...column, omit: true }
            : column,
        );
  const {
    columns: visibleColumns,
    entries: columnEntries,
    toggleColumn,
    showAll: showAllColumns,
  } = useColumnVisibility(processColumn);
  const hiddenColumnsPersisted = useMemo(
    () =>
      visibleColumns
        .filter((column) => column.id != null && column.omit)
        .map((column) => column.id as string | number),
    [visibleColumns],
  );
  const hiddenColumnsKey = hiddenColumnsPersisted.join(",");
  const hasActiveFilters = Object.values(filterValues).some(isFilterMeaningful);
  const isFirstPersistRun = useRef(true);
  useEffect(() => {
    if (!storageKey) return;
    if (isFirstPersistRun.current) {
      isFirstPersistRun.current = false;
      return;
    }
    const nextState: PersistedTableState = {
      filters: filterValues,
      search,
      page: currentPage,
      rowsPerPage,
      sort: currentSort,
      hiddenColumns: hiddenColumnsPersisted,
    };
    const isEmpty =
      !hasActiveFilters &&
      !search &&
      currentPage === 1 &&
      rowsPerPage === DEFAULT_ROWS_PER_PAGE &&
      currentSort == null &&
      hiddenColumnsKey === "";
    if (isEmpty) removePersistedState(storageKey);
    else writePersistedState(storageKey, nextState);
  }, [
    storageKey,
    hasActiveFilters,
    filterValues,
    search,
    currentPage,
    rowsPerPage,
    currentSort,
    hiddenColumnsKey,
  ]);
  const promptCheckedRef = useRef(false);
  useEffect(() => {
    if (!shouldPrompt || !storageKey || promptCheckedRef.current) return;
    if (isLoading) return;
    promptCheckedRef.current = true;
    const saved = readPersistedState(storageKey);
    if (!saved) return;
    const savedHasFilters = Object.values(saved.filters).some(isFilterMeaningful);
    if (!savedHasFilters && !saved.search) return;
    openModal("confirmation", {
      props: {
        title: "Limpiar filtros",
        message:
          "Hay filtros aplicados desde tu última visita. ¿Deseas limpiar los filtros?",
        confirmText: "Sí, limpiar",
        cancelText: "No, mantener",
        onConfirm: () => {
          clearFilters();
          closeModal();
        },
      },
    });
  }, [shouldPrompt, storageKey, isLoading]);
  const toggleableColumns = columnEntries.filter(
    (entry) => entry.column.id != null,
  );
  const conditionalActiveColumnStyles: ConditionalStyles<T>[] = [
    {
      when: (row) => !row.active,
      classNames: [
        "border-l-4",
        "border-base-300",
        "!bg-base-200/30",
        "!text-base-400",
      ],
    },
  ];
  const processConditionalRowStyles = [
    ...conditionalActiveColumnStyles,
    ...conditionalRowStyles,
  ];
  const inlineTheme = createTheme(customTheme, "rounded");
  return (
    <>
      <DataTable
        columns={visibleColumns}
        data={visibleData}
        pagination
        theme={inlineTheme}
        colorMode={tableTheme}
        noDataComponent={
          query && data.length > 0 ? (
            <div className="p-6 text-center text-base-600 dark:text-base-300">
              <p>Sin resultados para «{search.trim()}»</p>
            </div>
          ) : (
            <NoDataComponent
              label={labelButton}
              onAddRecord={onAddRecord}
              color={color}
            />
          )
        }
        progressPending={isLoading}
        progressComponent={
          <Spinner color={color} aria-label="Cargando clientes" />
        }
        paginationComponentOptions={{
          rowsPerPageText: "Registros por página",
          rangeSeparatorText: "de",
        }}
        resizable
        title={
          <div className="flex w-full items-center justify-between gap-4">
            {title && <SubTitles title={title} back_path={backPath} />}
            {message && message}
            <div className="flex items-center gap-3 w-1/2">
              {showColumnVisibility && toggleableColumns.length > 0 && (
                <Dropdown
                  inline
                  dismissOnClick={false}
                  theme={{ floating: { base: "z-50" } }}
                  label={
                    <span className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-base-300 px-2.5 py-1.5 text-sm text-base-700 hover:bg-base-100 dark:border-base-600 dark:text-base-200 dark:hover:bg-base-700">
                      <MdViewColumn className="size-4" />
                      Columnas
                    </span>
                  }
                >
                  <DropdownHeader>Columnas visibles</DropdownHeader>
                  {toggleableColumns.map(({ column, visible }) => (
                    <DropdownItem
                      key={String(column.id)}
                      onClick={() => toggleColumn(column.id as string | number)}
                      className="flex items-center gap-2"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                          visible
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-base-300 bg-white dark:border-base-600 dark:bg-base-800"
                        }`}
                      >
                        {visible && (
                          <svg
                            viewBox="0 0 16 16"
                            className="size-3 fill-white"
                            aria-hidden="true"
                          >
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L1.72 8.78a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                          </svg>
                        )}
                      </span>
                      <span>
                        {typeof column.name === "string" ||
                        typeof column.name === "number"
                          ? column.name
                          : String(column.id)}
                      </span>
                    </DropdownItem>
                  ))}
                  <DropdownDivider />
                  <DropdownItem onClick={showAllColumns}>
                    Mostrar todas
                  </DropdownItem>
                </Dropdown>
              )}
              <TextInput
                type="search"
                sizing="sm"
                className="ms-auto w-full"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
              {hasActiveColumn && inactiveCount > 0 && (
                <ToggleSwitch
                  checked={showInactive}
                  onChange={setShowInactive}
                  label={`Ver inactivos (${inactiveCount})`}
                  sizing="sm"
                  className="ms-auto min-w-40"
                />
              )}
            </div>
          </div>
        }
        {...props}
        pointerOnHover={props.pointerOnHover ?? true}
        highlightOnHover={props.highlightOnHover ?? true}
        paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 30]}
        paginationPerPage={rowsPerPage}
        paginationDefaultPage={currentPage}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handleRowsPerPageChange}
        defaultSortFieldId={currentSort?.columnId}
        defaultSortAsc={currentSort?.direction !== "desc"}
        onSort={handleSort}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        fixedHeader
        {...(scrollHeightOffset && {
          fixedHeaderScrollHeight: `calc(100vh - ${scrollHeightOffset}px)`,
        })}
        localization={{
          filter: {
            operators: {
              contains: "Contiene",
              notContains: "No contiene",
              equals: "Igual a",
              notEquals: "Distinto de",
              startsWith: "Empieza con",
              endsWith: "Termina con",
              blank: "Vacío",
              notBlank: "No vacío",
              gt: "Mayor que",
              gte: "Mayor o igual que",
              lt: "Menor que",
              lte: "Menor o igual que",
              between: "Entre",
              before: "Antes de",
              after: "Después de",
            },
            // resto del panel (defaults en inglés):
            valuePlaceholder: "Valor",
            applyLabel: "Aplicar",
            clearLabel: "Limpiar",
            andLabel: "Y",
            orLabel: "O",
            addConditionLabel: "+ Agregar condición",
            searchPlaceholder: "Buscar",
            noMatchesText: "Sin resultados",
            selectAllLabel: "(Seleccionar todo)",
            blanksLabel: "(Vacíos)",
            betweenSeparatorText: "y",
          },
        }}
        conditionalRowStyles={processConditionalRowStyles}
      />
      <div className="fixed bottom-6 right-6">
        {onAddRecord && (
          <Button color={color} onClick={onAddRecord}>
            <MdAddChart className="me-2 w-5 h-5" />
            {labelButton}
          </Button>
        )}
        {btnAction && (
          <Button
            color={color}
            onClick={btnAction.onClick}
            disabled={btnAction.disabled}
          >
            {btnAction.label}
          </Button>
        )}
      </div>
    </>
  );
}
