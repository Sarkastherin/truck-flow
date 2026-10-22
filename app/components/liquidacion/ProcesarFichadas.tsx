import { useEffect, useState, useMemo } from "react";
import type {
  FichadaFile,
  FichadasFileUI,
  FichadaFormValues,
} from "~/types/fichadas";
import { agruparFichadasPorDia } from "~/utils/agruparFichadas";
import { useRRHH } from "~/context/RRHHContext";
import { ImportFichadasButton } from "../ImportFichadasButton";
import {
  calcularHorasFichada,
  esFinDeSemana,
  parseFechasISO,
} from "~/utils/liquidacionCalculos";
import type { Fichada, Liquidacion } from "~/types/liquidaciones";
import { TbFileSettingsFilled } from "react-icons/tb";
import { formatDateUStoES } from "~/utils/formats";
import type { Employee } from "~/types/rrhh";
import { Button } from "flowbite-react";
import FichadasTableModal, { aplicarEdicionCelda } from "./FichadasTableModal";
import type { TableColumn } from "react-data-table-component";
import { useModal } from "~/context/ModalContext";

const parseFecha = (raw: string | number): Date => {
  if (typeof raw === "number") {
    // Serial de fecha de Google Sheets (días desde 1899-12-30)
    const utcMs = Math.round((raw - 25569) * 86400000);
    const d = new Date(utcMs);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw.trim());
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return new Date();
};
const parseHora = (raw: string | number | null | undefined): string | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    // Serial de hora de Google Sheets (fracción del día)
    const totalMinutes = Math.round(raw * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const text = String(raw).trim();
  const amPm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text);
  if (amPm) {
    let h = Number(amPm[1]) % 12;
    if (/pm/i.test(amPm[3])) h += 12;
    return `${String(h).padStart(2, "0")}:${amPm[2]}`;
  }
  const simple = /^(\d{1,2}):(\d{2})/.exec(text);
  if (simple) {
    return `${simple[1].padStart(2, "0")}:${simple[2]}`;
  }
  return null;
};
const toISODate = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

function Import({
  setIsLoadingImport,
  setFichadasFile,
  onProcessed,
  diasNoLaborables = [],
}: {
  setIsLoadingImport: React.Dispatch<React.SetStateAction<boolean>>;
  setFichadasFile: React.Dispatch<React.SetStateAction<FichadasFileUI[]>>;
  onProcessed: () => void;
  diasNoLaborables?: string[];
}) {
  const { employees, isReady, getSueldosData } = useRRHH();
  useEffect(() => {
    if (employees.length === 0 && !isReady) getSueldosData();
  }, [isReady, employees, getSueldosData]);
  const handleImport = (data: FichadaFile[]) => {
    setIsLoadingImport(true);
    const agrupadas = agruparFichadasPorDia(data, diasNoLaborables);
    const rows = agrupadas.map((liq) => {
      const empleado = employees.find((emp) => emp.dni == liq.dniEmpleado);
      return { empleado, ...liq };
    });
    setFichadasFile(rows);
    setIsLoadingImport(false);
    onProcessed();
  };
  return (
    <div
      className="flex flex-col justify-center items-center w-full gap-4"
      style={{ minHeight: "calc(100vh - 300px" }}
    >
      <ImportFichadasButton onImport={handleImport} />
    </div>
  );
}

export default function ProcesarFichadas({
  liquidacion,
  liquidacionId,
}: {
  liquidacion?: Liquidacion;
  liquidacionId?: string;
}) {
  const { CUDFichadas, employees } = useRRHH();
  const { openModal, closeModal } = useModal();
  const [importKey, setImportKey] = useState(0);
  const fichadasGuardadas = liquidacion?.fichada ?? [];
  const hayFichadasGuardadas = fichadasGuardadas.length > 0;
  const [fichadasFile, setFichadasFile] = useState<FichadasFileUI[]>([]);
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const handleOpenFromImport = () => setIsModalOpen(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const diasNoLaborables = useMemo(
    () => parseFechasISO(liquidacion?.dias_no_laborables),
    [liquidacion?.dias_no_laborables],
  );
  const modalTitle = liquidacion
    ? `Fichadas — ${formatDateUStoES(liquidacion.desde)} → ${formatDateUStoES(liquidacion.hasta)}`
    : "Fichadas";
  const hasNoEncontrados = fichadasFile.some((fich) => !fich.empleado);
  const hasFaltanSalidas = fichadasFile.some((fich) => !fich.salida);
  const handleCellEdit = (
    row: FichadasFileUI,
    value: string,
    column: TableColumn<FichadasFileUI>,
  ) => {
    const field =
      column.id === "entrada" || column.id === "salida" ? column.id : null;
    if (!field) return;
    setFichadasFile((prev) =>
      aplicarEdicionCelda(prev, row, value, field, diasNoLaborables),
    );
  };
  const handleOpenSaved = () => {
    setIsModalOpen(true);
    const feriados = new Set(diasNoLaborables);
    const rows: FichadasFileUI[] = fichadasGuardadas.map((fich) => {
      const empleado = employees.find((emp) => emp.id === fich.empleado_id);
      const esDiaLaborable =
        !esFinDeSemana(fich.fecha) && !feriados.has(fich.fecha);
      const { totalHorasTrabajadas, horasRegular, horasExtras } =
        calcularHorasFichada(fich.entrada, fich.salida, esDiaLaborable);
      return {
        id: fich.id,
        fecha: parseFecha(fich.fecha),
        dniEmpleado: String(empleado?.dni ?? ""),
        empleado,
        entrada: parseHora(fich.entrada) ?? "",
        salida: parseHora(fich.salida),
        totalHorasTrabajadas,
        horasRegular,
        horasExtras,
        active: fich.active,
      };
    });

    setFichadasFile(rows);
    setIsLoadingImport(false);
  };
  const handleSaveFichada = async () => {
    if (!liquidacionId || fichadasFile.length === 0) return;
    if (hasNoEncontrados) return;
    const payload: FichadaFormValues[] = fichadasFile.map((fich) => {
      const row: FichadaFormValues = {
        fecha: toISODate(fich.fecha),
        liquidacion_id: liquidacionId,
        empleado_id: fich.empleado?.id as string,
        entrada: fich.entrada,
        salida: fich.salida,
        active: fich.active,
      };
      if (fich.id) row.id = fich.id;
      return row;
    });

    setIsSaving(true);
    openModal("loading", {
      props: {
        title: "Cargando fichadas",
      },
    });
    try {
      const result = await CUDFichadas(payload as Fichada[], []);
      if (!result.success) {
        throw new Error(
          result.error || result.message || "No se pudo cargar las fichadas",
        );
      }
      closeModal();
      setIsModalOpen(false);
      setFichadasFile([]);
      openModal("success", {
        props: {
          title: "Fichadas guardadas",
          message: result.message || "Las fichadas se guardaron correctamente",
        },
      });
    } catch (error) {
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Hubo un error al guardar las fichadas. Inténtalo de nuevo.",
        },
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (!hayFichadasGuardadas) setFichadasFile([]);
  };
  const handleResetFile = () => {
    setIsModalOpen(false);
    setFichadasFile([]);
    setIsLoadingImport(false);
    setImportKey((k) => k + 1);
  };
  const handleAddFichada = (row: FichadasFileUI) => {
    setFichadasFile((prev) =>
      [...prev, row].sort((a, b) => {
        const diff = a.fecha.getTime() - b.fecha.getTime();
        if (diff !== 0) return diff;
        return (a.empleado?.nombre_completo ?? "").localeCompare(
          b.empleado?.nombre_completo ?? "",
          "es",
        );
      }),
    );
  };
  return (
    <div>
      {!hayFichadasGuardadas ? (
        <Import
          key={`import-${importKey}`}
          setFichadasFile={setFichadasFile}
          setIsLoadingImport={setIsLoadingImport}
          onProcessed={handleOpenFromImport}
          diasNoLaborables={diasNoLaborables}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl border border-base-200 bg-base-50 p-10 text-center dark:border-base-700 dark:bg-base-800"
          style={{ minHeight: "calc(100vh - 300px)" }}
        >
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 text-white shadow-sm">
            <TbFileSettingsFilled className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-base-800 dark:text-base-100">
              Fichadas guardadas
            </span>
            <span className="text-sm text-base-500 dark:text-base-400">
              {fichadasGuardadas.length} fichada
              {fichadasGuardadas.length === 1 ? "" : "s"} en el período{" "}
              {liquidacion &&
                `${formatDateUStoES(liquidacion.desde)} → ${formatDateUStoES(liquidacion.hasta)}`}
            </span>
          </div>
          <Button color="yellow" onClick={handleOpenSaved}>
            Ver y editar fichadas
          </Button>
        </div>
      )}
      <FichadasTableModal
        show={isModalOpen}
        title={modalTitle}
        rows={fichadasFile}
        onCellEdit={handleCellEdit}
        onSave={handleSaveFichada}
        onClose={handleCloseModal}
        onReset={hayFichadasGuardadas ? undefined : handleResetFile}
        isLoading={isLoadingImport}
        isSaving={isSaving}
        hasNoEncontrados={hasNoEncontrados}
        hasFaltanSalidas={hasFaltanSalidas}
        diasNoLaborables={diasNoLaborables}
        employees={employees}
        desde={liquidacion?.desde ?? ""}
        hasta={liquidacion?.hasta ?? ""}
        onAddRow={handleAddFichada}
      />
    </div>
  );
}
