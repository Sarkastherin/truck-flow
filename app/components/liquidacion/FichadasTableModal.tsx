import { useState } from "react";
import { Alert, Button } from "flowbite-react";
import { FaRegIdCard } from "react-icons/fa";
import { HiExclamation } from "react-icons/hi";
import TableComponent from "~/components/TableComponentNew";
import { Modal } from "~/components/modals/ModalBase";
import type {
  ConditionalStyles,
  TableColumn,
} from "react-data-table-component";
import type { FichadasFileUI } from "~/types/fichadas";
import {
  calcularHorasFichada,
  esFinDeSemana,
  fechaAISO,
} from "~/utils/liquidacionCalculos";

const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

const formatFecha = (fecha: Date) =>
  fecha.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const formatDni = (dni: string | number) => {
  const dniString = String(dni);
  const first = dniString.slice(0, 2);
  const second = dniString.slice(2, 5);
  const third = dniString.slice(5, 8);
  return `${first}.${second}.${third}`;
};

export const isValidHora = (value: string) => TIME_REGEX.test(value);

export const aplicarEdicionCelda = (
  rows: FichadasFileUI[],
  row: FichadasFileUI,
  value: string,
  field: "entrada" | "salida",
  diasNoLaborables: string[] = [],
): FichadasFileUI[] => {
  if (!isValidHora(value)) return rows;
  return rows.map((r) => {
    if (r !== row) return r;
    const entrada = field === "entrada" ? value : r.entrada;
    const salida = field === "salida" ? value : r.salida;
    const iso = fechaAISO(r.fecha);
    const esDiaLaborable =
      !esFinDeSemana(iso) && !diasNoLaborables.includes(iso);
    return {
      ...r,
      entrada,
      salida,
      ...calcularHorasFichada(entrada, salida, esDiaLaborable),
    };
  });
};

export const getFichadasColumns = (
  onCellEdit: (
    row: FichadasFileUI,
    value: string,
    column: TableColumn<FichadasFileUI>,
  ) => void,
): TableColumn<FichadasFileUI>[] => [
  {
    name: "Fecha",
    selector: (row) => formatFecha(row.fecha),
    width: "120px",
    filterable: true,
    filterType: "date",
    sortable: true,
  },
  {
    name: "Empleado",
    selector: (row) => row.empleado?.nombre_completo || "No encontrado",
    filterable: true,
    sortable: true,
  },
  {
    name: "DNI",
    selector: (row) => formatDni(row.dniEmpleado),
    width: "120px",
    filterable: true,
    sortable: true,
  },
  {
    name: "Entrada",
    id: "entrada",
    selector: (row) => row.entrada,
    width: "90px",
    editable: true,
    onCellEdit,
  },
  {
    name: "Salida",
    id: "salida",
    selector: (row) => row.salida ?? "",
    width: "90px",
    editable: true,
    onCellEdit,
    sortable: true,
  },
  {
    name: "Total HS",
    selector: (row) => row.totalHorasTrabajadas,
    width: "110px",
    filterable: true,
    filterType: "number",
    sortable: true,
  },
  {
    name: "HS Reg.",
    selector: (row) => row.horasRegular,
    width: "110px",
  },
  {
    name: "HS Extras",
    selector: (row) => row.horasExtras,
    width: "110px",
  },
];

export const getFichadasRowStyles = (
  diasNoLaborables: string[] = [],
): ConditionalStyles<FichadasFileUI>[] => {
  const feriados = new Set(diasNoLaborables);
  const esFeriado = (row: FichadasFileUI) => feriados.has(fechaAISO(row.fecha));
  const esFinDeSemana = (row: FichadasFileUI) =>
    row.fecha.getDay() === 0 || row.fecha.getDay() === 6;

  return [
    {
      when: esFeriado,
      classNames: ["!bg-purple-100/50", "dark:!bg-purple-900/20"],
    },
    {
      when: (row) => esFinDeSemana(row) && !esFeriado(row),
      classNames: ["!bg-blue-100/40", "dark:!bg-blue-900/20"],
    },
    {
      when: (row) => !row.salida,
      classNames: [
        "border-l-4",
        "border-red-500",
        "!bg-red-300/20",
        "!text-red-500",
      ],
    },
  ];
};

export default function FichadasTableModal({
  show,
  title,
  rows,
  onCellEdit,
  onSave,
  onClose,
  onReset,
  isLoading,
  isSaving,
  hasNoEncontrados,
  hasFaltanSalidas,
  diasNoLaborables = [],
}: {
  show: boolean;
  title: string;
  rows: FichadasFileUI[];
  onCellEdit: (
    row: FichadasFileUI,
    value: string,
    column: TableColumn<FichadasFileUI>,
  ) => void;
  onSave: () => void;
  onClose: () => void;
  onReset?: () => void;
  isLoading: boolean;
  isSaving: boolean;
  hasNoEncontrados: boolean;
  hasFaltanSalidas: boolean;
  diasNoLaborables?: string[];
}) {
  const [showDniAlert, setShowDniAlert] = useState(true);
  const columns = getFichadasColumns(onCellEdit);
  const rowStyles = getFichadasRowStyles(diasNoLaborables);
  const saveDisabled = isSaving || hasNoEncontrados || hasFaltanSalidas;

  return (
    <Modal
      open={show}
      title={title}
      size="full"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onReset && (
              <Button color="dark" onClick={onReset} disabled={isSaving}>
                Volver a cargar archivo
              </Button>
            )}
            {hasFaltanSalidas && (
              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                Faltan completar salidas para poder guardar
              </span>
            )}
            {hasNoEncontrados && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Hay DNIs sin registrar en Empleados
              </span>
            )}
          </div>
          <Button
            color="yellow"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {isSaving ? "Guardando..." : "Guardar, y continuar"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {hasNoEncontrados && showDniAlert && (
          <Alert
            color="red"
            withBorderAccent
            icon={FaRegIdCard}
            onDismiss={() => setShowDniAlert(false)}
          >
            <span>
              <span className="font-bold">DNI no encontrado</span> Hay algunos
              DNI's en el archivo de fichadas que no están registrados en el
              listado de <em className="font-medium">Empleados</em>. Agregalos
              en <em className="font-medium">Empleados</em> o corrijelos{" "}
              <em className="font-medium">el archivo de fichadas</em>
            </span>
          </Alert>
        )}
        {hasFaltanSalidas && (
          <Alert
            color="yellow"
            withBorderAccent
            icon={HiExclamation}
          >
            <span>
              <span className="font-bold">Faltan completar salidas</span> Hay
              algunos registros que no tienen la{" "}
              <em className="font-medium">hora de salida</em>, por favor
              completalos en esta <em className="font-medium">Tabla</em>.
            </span>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-base-500 dark:text-base-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded bg-blue-100/70 dark:bg-blue-900/40" />
            Fines de semana
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded bg-purple-100/70 dark:bg-purple-900/40" />
            Feriados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded bg-red-300/60" />
            Sin salida
          </span>
        </div>
        <TableComponent
          columns={columns}
          data={rows}
          title="Fichadas"
          backPath=""
          isLoading={isLoading}
          color="yellow"
          labelButton=""
          hasActiveColumn={false}
          scrollHeightOffset={400}
          searchKeys={["empleado.nombre_completo", "empleado.dni"]}
          searchPlaceholder="Buscar por nombre o DNI"
          pointerOnHover={false}
          highlightOnHover={false}
          cellNavigation
          conditionalRowStyles={rowStyles}
        />
      </div>
    </Modal>
  );
}
