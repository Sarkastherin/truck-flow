import DataTable, {
  type TableColumn,
  type TableProps,
  type ConditionalStyles,
} from "react-data-table-component";
import {
  useThemeMode,
  Button,
  Spinner,
  ToggleSwitch,
  TextInput,
} from "flowbite-react";
import { useState } from "react";
import { MdAddChart } from "react-icons/md";
import { SubTitles } from "./SubTitles";
import { Badge } from "flowbite-react";
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
  title: string;
  backPath: string;
  color: ColorsTypes;
  scrollHeightOffset?: number;
  searchKeys?: ReadonlyArray<string>;
  searchPlaceholder?: string;
  hasActiveColumn?: boolean;
  btnAction?: {
    onClick: () => void;
    label: string;
    disabled?: boolean
  };
  conditionalRowStyles?:ConditionalStyles<T>[]
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
  ...props
}: TableComponentProps<T>) {
  const stateActiveColumn: TableColumn<T>[] | [] = hasActiveColumn
    ? [
        {
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
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
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
  const processColumn = hasActiveColumn
    ? [...columns, ...stateActiveColumn]
    : columns;
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
  const processConditionalRowStyles = [...conditionalActiveColumnStyles, ...conditionalRowStyles]
  return (
    <>
      <DataTable
        columns={processColumn}
        data={visibleData}
        pagination
        theme="rounded"
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
            <SubTitles title={title} back_path={backPath} />
            <div className="flex items-center gap-3">
              <TextInput
                type="search"
                sizing="sm"
                className="min-w-50"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {hasActiveColumn && inactiveCount > 0 && (
                <ToggleSwitch
                  checked={showInactive}
                  onChange={setShowInactive}
                  label={`Ver inactivos (${inactiveCount})`}
                  color="primary"
                  sizing="sm"
                />
              )}
            </div>
          </div>
        }
        {...props}
        pointerOnHover={props.pointerOnHover ?? true}
        highlightOnHover={props.highlightOnHover ?? true}
        paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 30]}
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
        conditionalRowStyles={conditionalRowStyles}
      />
      <div className="fixed bottom-6 right-6">
        {onAddRecord && (
          <Button color={color} onClick={onAddRecord}>
            <MdAddChart className="me-2 w-5 h-5" />
            {labelButton}
          </Button>
        )}
        {btnAction && (
          <Button color={color} onClick={btnAction.onClick} disabled={btnAction.disabled}>
            {btnAction.label}
          </Button>
        )}
      </div>
    </>
  );
}
