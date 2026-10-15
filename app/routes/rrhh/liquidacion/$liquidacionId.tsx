import { useMemo, useState, useRef } from "react";
import type { Route } from "../../+types/home";
import { useParams } from "react-router";
import { useRRHH } from "~/context/RRHHContext";
import { Button, Card, TabItem, Tabs, type TabsRef } from "flowbite-react";
import { LuArrowRight, LuCalendarDays } from "react-icons/lu";
import type { Fichada, Reporte, LiquidacionResumen, ReporteFormValues } from "~/types/liquidaciones";
import { BadgeStatusLiq } from "~/components/specials/Badges";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { getDiasPeriodo } from "~/components/modals/customs/SeleccionarLiquidacionModal";
import { TbFileSettingsFilled } from "react-icons/tb";
import { BiSolidReport } from "react-icons/bi";
import { FaBox } from "react-icons/fa6";
import type { IconType } from "react-icons";
import Import from "~/components/liquidacion/import";
import FichadasTableModal, {
  aplicarEdicionCelda,
} from "~/components/liquidacion/FichadasTableModal";
import ReportesEmpleadoModal from "~/components/liquidacion/ReportesEmpleadoModal";
import type { FichadasFileUI, FichadaFormValues } from "~/types/fichadas";
import { useModal } from "~/context/ModalContext";
import type { TableColumn } from "react-data-table-component";
import TableComponent from "~/components/TableComponentNew";
import type { Employee } from "~/types/rrhh";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Liquidación" },
    { name: "description", content: "Liquidación" },
  ];
}

type TabsTypes = "fichadas" | "produccion" | "resumen";

const toISODate = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

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
const formatCurrency = (value: number) =>
  value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

type ResumenRow = LiquidacionResumen & { active?: boolean };

export default function Liquidacion() {
  const {
    liquidaciones,
    employees,
    premios,
    isLoading,
    CUDFichadas,
    CUDReportes,
  } = useRRHH();
  const { liquidacionId } = useParams();
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [fichadasFile, setFichadasFile] = useState<FichadasFileUI[]>([]);
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importKey, setImportKey] = useState(0);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Employee | null>(
    null,
  );
  const [isSavingReportes, setIsSavingReportes] = useState(false);
  const { openModal, closeModal } = useModal();
  const liquidacion = useMemo(() => {
    return liquidaciones.find((liq) => liq.id === liquidacionId);
  }, [liquidaciones, liquidacionId]);
  const dias = liquidacion
    ? getDiasPeriodo(liquidacion.desde, liquidacion.hasta)
    : null;

  const items: {
    key: TabsTypes;
    name: string;
    description?: string;
    icon: IconType;
  }[] = [
    {
      key: "fichadas",
      name: "Procesar Fichadas",
      description:
        "Ingresa el archivo de fichadas para calcular horas trabajadas",
      icon: TbFileSettingsFilled,
    },
    {
      key: "produccion",
      name: "Producción",
      description:
        "Registra los trabajos elaborados por empleado para obtener el calculo de PREMIOS",
      icon: FaBox,
    },
    {
      key: "resumen",
      name: "Reporte y resumen",
      description: "Obten el resumen de la liquidación del periodo en curso",
      icon: BiSolidReport,
    },
  ];

  const fichadasGuardadas = liquidacion?.fichada ?? [];
  const reportesGuardados = liquidacion?.reporte ?? [];
  const hayFichadasGuardadas = fichadasGuardadas.length > 0;
  const hayReportesGuardados = reportesGuardados.length > 0;

  const resumen: ResumenRow[] = useMemo(() => {
    const premioById = new Map(premios.map((premio) => [premio.id, premio]));
    return employees
      .filter((emp) => emp.active !== false)
      .map((empleado) => {
        const fichadas = fichadasGuardadas.filter(
          (fich) => fich.empleado_id === empleado.id,
        );
        const reportes = reportesGuardados.filter(
          (rep) => rep.empleado_id === empleado.id,
        );
        const total_horas_regulares = fichadas.reduce(
          (acc, fich) => acc + (Number(fich.horas_regular) || 0),
          0,
        );
        const total_horas_extras = fichadas.reduce(
          (acc, fich) => acc + (Number(fich.horas_extras) || 0),
          0,
        );
        const monto_premio = reportes.reduce((acc, rep) => {
          const premio = premioById.get(rep.premio_id);
          const precio = Number(premio?.precio) || 0;
          return acc + precio * (Number(rep.cantidad) || 0);
        }, 0);
        return {
          empleado,
          fichadas,
          reportes,
          total_horas_regulares,
          total_horas_extras,
          monto_salario: 0,
          monto_premio,
        };
      });
  }, [employees, premios, fichadasGuardadas, reportesGuardados]);

  const totalPremiosGeneral = useMemo(
    () => resumen.reduce((acc, row) => acc + row.monto_premio, 0),
    [resumen],
  );

  const produccionColumns: TableColumn<ResumenRow>[] = [
    {
      name: "Empleado",
      selector: (row) => row.empleado.nombre_completo,
      sortable: true,
      filterable: true,
      filterType: "text",
      grow: 1,
    },
    {
      name: "DNI",
      selector: (row) => String(row.empleado.dni),
      width: "140px",
      sortable: true,
      filterable: true,
    },
    {
      name: "Reportes",
      selector: (row) => row.reportes.length,
      width: "110px",
      center: true,
    },
    {
      name: "Total premios",
      selector: (row) => row.monto_premio,
      cell: (row) => (
        <span className="font-semibold">{formatCurrency(row.monto_premio)}</span>
      ),
      width: "170px",
      right: true,
      sortable: true,
    },
  ];

  const hasNoEncontrados = fichadasFile.some((fich) => !fich.empleado);
  const hasFaltanSalidas = fichadasFile.some((fich) => !fich.salida);

  const modalTitle = liquidacion
    ? `Fichadas — ${formatDateUStoES(liquidacion.desde)} → ${formatDateUStoES(liquidacion.hasta)}`
    : "Fichadas";

  const handleOpenFromImport = () => setIsModalOpen(true);

  const handleOpenSaved = () => {
    const rows: FichadasFileUI[] = fichadasGuardadas.map((fich) => {
      const empleado = employees.find((emp) => emp.id === fich.empleado_id);
      return {
        id: fich.id,
        fecha: parseFecha(fich.fecha),
        dniEmpleado: String(empleado?.dni ?? ""),
        empleado,
        entrada: parseHora(fich.entrada) ?? "",
        salida: parseHora(fich.salida),
        totalHorasTrabajadas: fich.total_horas,
        horasRegular: fich.horas_regular,
        horasExtras: fich.horas_extras,
        active: fich.active,
      };
    });
    setFichadasFile(rows);
    setIsModalOpen(true);
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

  const handleCellEdit = (
    row: FichadasFileUI,
    value: string,
    column: TableColumn<FichadasFileUI>,
  ) => {
    const field =
      column.id === "entrada" || column.id === "salida" ? column.id : null;
    if (!field) return;
    setFichadasFile((prev) => aplicarEdicionCelda(prev, row, value, field));
  };

  const handleSaveFichada = async () => {
    if (!liquidacionId || fichadasFile.length === 0) return;
    if (hasNoEncontrados || hasFaltanSalidas) return;

    const payload: FichadaFormValues[] = fichadasFile.map((fich) => {
      const row: FichadaFormValues = {
        fecha: toISODate(fich.fecha),
        liquidacion_id: liquidacionId,
        empleado_id: fich.empleado?.id as string,
        entrada: fich.entrada,
        salida: fich.salida,
        total_horas: fich.totalHorasTrabajadas,
        horas_regular: fich.horasRegular,
        horas_extras: fich.horasExtras,
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

  const selectedEmpleadoRow = selectedEmpleado
    ? resumen.find((row) => row.empleado.id === selectedEmpleado.id)
    : undefined;

  const handleCloseReportesModal = () => {
    setSelectedEmpleado(null);
  };

  const handleSaveReportes = async (
    reportes: ReporteFormValues[],
    deletedIds: string[],
  ) => {
    if (!liquidacionId || !selectedEmpleado) return;

    setIsSavingReportes(true);
    openModal("loading", {
      props: {
        title: "Guardando reportes",
      },
    });
    try {
      const result = await CUDReportes(reportes as Reporte[], deletedIds);
      if (!result.success) {
        throw new Error(
          result.error || result.message || "No se pudieron guardar los reportes",
        );
      }
      closeModal();
      setSelectedEmpleado(null);
      openModal("success", {
        props: {
          title: "Reportes guardados",
          message: result.message || "Los reportes se guardaron correctamente",
        },
      });
    } catch (error) {
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Hubo un error al guardar los reportes. Inténtalo de nuevo.",
        },
      });
    } finally {
      setIsSavingReportes(false);
    }
  };
  return (
    <>
      <Card>
        {liquidacion && (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-indigo-500 text-white shadow-sm shadow-primary-500/30">
                <LuCalendarDays className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 font-semibold text-base-800 dark:text-base-100">
                  {formatDateUStoES(liquidacion.desde)}
                  <LuArrowRight className="size-3.5 shrink-0 text-base-400" />
                  {formatDateUStoES(liquidacion.hasta)}
                </span>
                <span className="text-xs text-base-500 dark:text-base-400">
                  {dias
                    ? `Periodo de ${dias} día${dias === 1 ? "" : "s"}`
                    : "Periodo"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs uppercase tracking-tight font-semibold text-base-500">
                Status
              </span>
              <BadgeStatusLiq status={liquidacion.status} />
            </div>
          </div>
        )}
      </Card>
      <Tabs
        className="mt-2"
        aria-label="Liquidacion"
        variant="default"
        ref={tabsRef}
        onActiveTabChange={(tab) => setActiveTab(tab)}
      >
        {items.map(({ name, icon }) => (
          <TabItem className="cursor-pointer" active title={name} icon={icon}>
            {activeTab === 0 && (
              <div>
                {!hayFichadasGuardadas ? (
                  <Import
                    key={`import-${importKey}`}
                    setFichadasFile={setFichadasFile}
                    setIsLoadingImport={setIsLoadingImport}
                    onProcessed={handleOpenFromImport}
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
                        {fichadasGuardadas.length === 1 ? "" : "s"} en el
                        período{" "}
                        {liquidacion &&
                          `${formatDateUStoES(liquidacion.desde)} → ${formatDateUStoES(liquidacion.hasta)}`}
                      </span>
                    </div>
                    <Button color="yellow" onClick={handleOpenSaved}>
                      Ver y editar fichadas
                    </Button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 1 && (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-end gap-3 rounded-xl border border-base-200 bg-base-50 px-4 py-3 dark:border-base-700 dark:bg-base-800">
                  <span className="text-sm font-medium text-base-500 dark:text-base-400">
                    Total general de premios
                  </span>
                  <span className="text-lg font-bold text-base-800 dark:text-base-100">
                    {formatCurrency(totalPremiosGeneral)}
                  </span>
                </div>
                <TableComponent
                  columns={produccionColumns}
                  data={resumen}
                  title="Resumen de producción"
                  backPath=""
                  isLoading={isLoading}
                  color="yellow"
                  labelButton=""
                  hasActiveColumn={false}
                  onRowClicked={(row) => setSelectedEmpleado(row.empleado)}
                  searchKeys={["empleado.nombre_completo", "empleado.dni"]}
                  searchPlaceholder="Buscar por nombre o DNI"
                  scrollHeightOffset={430}
                />
              </div>
            )}
            {activeTab === 2 && <div>resumen</div>}
          </TabItem>
        ))}
      </Tabs>
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
      />
      <ReportesEmpleadoModal
        show={Boolean(selectedEmpleado)}
        empleado={selectedEmpleado}
        rows={selectedEmpleadoRow?.reportes ?? []}
        premios={premios}
        liquidacionId={liquidacionId ?? ""}
        isSaving={isSavingReportes}
        onSave={handleSaveReportes}
        onClose={handleCloseReportesModal}
      />
    </>
  );
}
