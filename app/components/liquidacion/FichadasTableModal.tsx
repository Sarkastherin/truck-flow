import { useEffect, useState } from "react";
import { Alert, Button } from "flowbite-react";
import { FaRegIdCard } from "react-icons/fa";
import { HiExclamation } from "react-icons/hi";
import { LuPlus, LuX } from "react-icons/lu";
import TableComponent from "~/components/TableComponentNew";
import { Modal } from "~/components/modals/ModalBase";
import { Input, SelectWithSearch } from "~/components/InputsForm";
import type {
  ConditionalStyles,
  TableColumn,
} from "react-data-table-component";
import type { FichadasFileUI } from "~/types/fichadas";
import type { Employee } from "~/types/rrhh";
import {
  calcularHorasFichada,
  esFinDeSemana,
  fechaAISO,
} from "~/utils/liquidacionCalculos";
import { formatDni } from "~/types/rrhh";

const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/;

const formatFecha = (fecha: Date) =>
  fecha.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });


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

export const crearFichadaUI = (
  empleado: Employee,
  fechaISO: string,
  entrada: string,
  salida: string | null,
  diasNoLaborables: string[] = [],
): FichadasFileUI => {
  const esDiaLaborable =
    !esFinDeSemana(fechaISO) && !diasNoLaborables.includes(fechaISO);
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return {
    fecha: new Date(anio, mes - 1, dia),
    dniEmpleado: String(empleado.dni),
    empleado,
    entrada,
    salida,
    ...calcularHorasFichada(entrada, salida, esDiaLaborable),
    active: true,
  };
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
    filterable: true,
    filterType: "date",
    sortable: true,
    grow: 0,
  },
  {
    name: "Empleado",
    selector: (row) => row.empleado?.nombre_completo || "No encontrado",
    filterable: true,
    sortable: true,
  },
  {
    name: "DNI",
    selector: (row) => row.dniEmpleado,
    format: (row) => formatDni(row.dniEmpleado),
    filterable: true,
    sortable: true,
    grow: 0,
  },
  {
    name: "Entrada",
    id: "entrada",
    selector: (row) => row.entrada,
    editable: true,
    onCellEdit,
    grow: 0,
  },
  {
    name: "Salida",
    id: "salida",
    selector: (row) => row.salida ?? "",
    editable: true,
    onCellEdit,
    sortable: true,
    grow: 0,
  },
  {
    name: "Total HS",
    selector: (row) => row.totalHorasTrabajadas,
    filterable: true,
    filterType: "number",
    sortable: true,
    grow: 0,
  },
  {
    name: "HS Reg.",
    selector: (row) => row.horasRegular,
    grow: 0,
  },
  {
    name: "HS Extras",
    selector: (row) => row.horasExtras,
    grow: 0,
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
      classNames: ["!bg-lime-400/10"],
    },
    {
      when: (row) => esFinDeSemana(row) && !esFeriado(row),
      classNames: ["!bg-blue-200/30", "dark:!bg-blue-900/20"],
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
  employees = [],
  desde = "",
  hasta = "",
  onAddRow,
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
  employees?: Employee[];
  desde?: string;
  hasta?: string;
  onAddRow?: (row: FichadasFileUI) => void;
}) {
  const [showDniAlert, setShowDniAlert] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmpleado, setNewEmpleado] = useState<Employee | null>(null);
  const [newFecha, setNewFecha] = useState("");
  const [newEntrada, setNewEntrada] = useState("");
  const [newSalida, setNewSalida] = useState("");
  const [addError, setAddError] = useState("");
  const columns = getFichadasColumns(onCellEdit);
  const rowStyles = getFichadasRowStyles(diasNoLaborables);
  const saveDisabled = isSaving || hasNoEncontrados;

  useEffect(() => {
    if (!show) return;
    setShowAddForm(false);
    setNewEmpleado(null);
    setNewFecha("");
    setNewEntrada("");
    setNewSalida("");
    setAddError("");
  }, [show]);

  const empleadosItems = employees
    .filter((emp) => emp.active !== false)
    .map((emp) => ({
      id: String(emp.id),
      name: emp.nombre_completo,
    }));

  const handleToggleAddForm = () => {
    setShowAddForm((prev) => {
      const next = !prev;
      if (next) {
        setNewEmpleado(null);
        setNewFecha("");
        setNewEntrada("");
        setNewSalida("");
        setAddError("");
      }
      return next;
    });
  };

  const handleConfirmAdd = () => {
    if (!newEmpleado) {
      setAddError("Seleccioná un empleado");
      return;
    }
    if (!newFecha) {
      setAddError("Ingresá una fecha");
      return;
    }
    if (desde && hasta && (newFecha < desde || newFecha > hasta)) {
      setAddError("La fecha debe estar dentro del período de la liquidación");
      return;
    }
    if (!isValidHora(newEntrada.trim())) {
      setAddError("Ingresá una hora de entrada válida (HH:MM)");
      return;
    }
    const salida = newSalida.trim();
    if (salida && !isValidHora(salida)) {
      setAddError("Ingresá una hora de salida válida (HH:MM)");
      return;
    }
    const esDuplicada = rows.some(
      (r) =>
        fechaAISO(r.fecha) === newFecha &&
        r.dniEmpleado === String(newEmpleado.dni),
    );
    if (esDuplicada) {
      setAddError("El empleado ya tiene fichada para ese día");
      return;
    }
    onAddRow?.(
      crearFichadaUI(
        newEmpleado,
        newFecha,
        newEntrada.trim(),
        salida || null,
        diasNoLaborables,
      ),
    );
    setNewEmpleado(null);
    setNewFecha("");
    setNewEntrada("");
    setNewSalida("");
    setAddError("");
    setShowAddForm(false);
  };

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
                Faltan completar salidas — el resumen se mostrará cuando todas
                estén completas
              </span>
            )}
            {hasNoEncontrados && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Hay DNIs sin registrar en Empleados
              </span>
            )}
          </div>
          <Button color="yellow" onClick={onSave} disabled={saveDisabled}>
            {isSaving ? "Guardando..." : "Guardar, y continuar"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 -my-4">
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
          <Alert color="yellow" withBorderAccent icon={HiExclamation}>
            <span>
              <span className="font-bold">Faltan completar salidas</span> Podés
              guardar igual, pero la pestaña{" "}
              <em className="font-medium">Reporte y resumen</em> no se generará
              hasta que todas las fichadas tengan{" "}
              <em className="font-medium">hora de salida</em>.
            </span>
          </Alert>
        )}
        {showAddForm && (
          <div className="rounded-xl border border-base-200 bg-base-50 p-4 dark:border-base-700 dark:bg-base-800">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <SelectWithSearch
                  input={{
                    label: "Empleado",
                    placeholder: "Buscar por nombre",
                    value: newEmpleado?.nombre_completo ?? "",
                  }}
                  search={{
                    placeholder: "Buscar empleado",
                  }}
                  data={{
                    items: empleadosItems,
                    onSelect: (item) => {
                      const emp =
                        employees.find((e) => String(e.id) === item.id) ?? null;
                      setNewEmpleado(emp);
                      setAddError("");
                    },
                  }}
                  error=""
                  requiredField
                />
              </div>
              <Input
                type="date"
                label="Fecha"
                value={newFecha}
                min={desde || undefined}
                max={hasta || undefined}
                onChange={(e) => {
                  setNewFecha(e.target.value);
                  setAddError("");
                }}
                requiredField
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Entrada"
                  placeholder="HH:MM"
                  value={newEntrada}
                  maxLength={5}
                  onChange={(e) => {
                    setNewEntrada(e.target.value);
                    setAddError("");
                  }}
                  requiredField
                />
                <Input
                  label="Salida"
                  placeholder="HH:MM"
                  value={newSalida}
                  maxLength={5}
                  onChange={(e) => {
                    setNewSalida(e.target.value);
                    setAddError("");
                  }}
                />
              </div>
            </div>
            {addError && (
              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {addError}
              </p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <Button
                color="alternative"
                size="sm"
                onClick={handleToggleAddForm}
              >
                Cancelar
              </Button>
              <Button color="yellow" size="sm" onClick={handleConfirmAdd}>
                Agregar
              </Button>
            </div>
          </div>
        )}
        <TableComponent
          columns={columns}
          data={rows}
          //title="Fichadas"
          backPath=""
          isLoading={isLoading}
          color="yellow"
          labelButton=""
          hasActiveColumn={false}
          persistFilters={false}
          scrollHeightOffset={400}
          searchKeys={["empleado.nombre_completo", "empleado.dni"]}
          searchPlaceholder="Buscar por nombre o DNI"
          pointerOnHover={false}
          highlightOnHover={false}
          cellNavigation
          conditionalRowStyles={rowStyles}
          customTheme={{
            typography: { fontSize: "13px", fontSizeHeader: "13px" },
            spacing: {
              rowHeight: "34px",
              cellPaddingX: "8px",
            },
            text: {
              primary: "#333333",
            },
          }}
          message={
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-base-500 dark:text-base-400">
              {onAddRow && (
                <Button color="yellow" size="sm" onClick={handleToggleAddForm}>
                  {showAddForm ? (
                    <>
                      <LuX className="me-1 size-4" />
                      Cerrar
                    </>
                  ) : (
                    <>
                      <LuPlus className="me-1 size-4" />
                      Agregar fichada
                    </>
                  )}
                </Button>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold">Leyendas:</span>

                <span className="flex items-center gap-1.5">
                  <div className="inline-block size-3 rounded bg-blue-200/30 dark:bg-blue-900/40 border border-blue-400" />
                  Fines de semana
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="inline-block size-3 rounded bg-lime-100/70 dark:bg-lime-700/40 border border-lime-400" />
                  Feriados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-3 rounded bg-red-300/60" />
                  Sin salida
                </span>
              </div>
            </div>
          }
          pagination={false}
        />
      </div>
    </Modal>
  );
}
