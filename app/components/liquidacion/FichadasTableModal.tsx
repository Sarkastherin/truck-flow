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

const calcHoras = (
  entrada: string,
  salida: string | null,
): Pick<
  FichadasFileUI,
  "totalHorasTrabajadas" | "horasRegular" | "horasExtras"
> => {
  const toMinutes = (hora: string) => {
    const parts = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
    if (!parts) return null;
    const h = Number(parts[1]);
    const m = Number(parts[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  };
  if (!salida) {
    return { totalHorasTrabajadas: 0, horasRegular: 0, horasExtras: 0 };
  }
  const entradaM = toMinutes(entrada);
  const salidaM = toMinutes(salida);
  if (entradaM === null || salidaM === null) {
    return { totalHorasTrabajadas: 0, horasRegular: 0, horasExtras: 0 };
  }
  let diff = salidaM - entradaM;
  if (diff < 0) diff += 24 * 60;
  const totalHorasTrabajadas = Math.round((diff / 60) * 100) / 100;
  const horasRegular =
    totalHorasTrabajadas === 0
      ? 0
      : totalHorasTrabajadas >= 9.5
        ? 9.5
        : totalHorasTrabajadas;
  const horasExtras = Number(
    (totalHorasTrabajadas - horasRegular).toFixed(2),
  );
  return { totalHorasTrabajadas, horasRegular, horasExtras };
};

export const aplicarEdicionCelda = (
  rows: FichadasFileUI[],
  row: FichadasFileUI,
  value: string,
  field: "entrada" | "salida",
): FichadasFileUI[] => {
  if (!isValidHora(value)) return rows;
  return rows.map((r) => {
    if (r !== row) return r;
    const entrada = field === "entrada" ? value : r.entrada;
    const salida = field === "salida" ? value : r.salida;
    return {
      ...r,
      entrada,
      salida,
      ...calcHoras(entrada, salida),
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

export const getFichadasRowStyles =
  (): ConditionalStyles<FichadasFileUI>[] => [
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
}) {
  const [showDniAlert, setShowDniAlert] = useState(true);
  const columns = getFichadasColumns(onCellEdit);
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
          conditionalRowStyles={getFichadasRowStyles()}
        />
      </div>
    </Modal>
  );
}
