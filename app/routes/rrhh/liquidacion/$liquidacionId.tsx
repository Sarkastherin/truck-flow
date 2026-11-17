import { useMemo, useState, useRef } from "react";
import type { Route } from "../../+types/home";
import { useParams } from "react-router";
import { useRRHH } from "~/context/RRHHContext";
import {
  Badge,
  Button,
  Card,
  TabItem,
  Tabs,
  type TabsRef,
} from "flowbite-react";
import { LuArrowRight, LuCalendarDays, LuCheckCheck, LuSettings2 } from "react-icons/lu";
import type { Liquidacion, LiquidacionResumen } from "~/types/liquidaciones";
import { BadgeStatusLiq } from "~/components/specials/Badges";
import { formatDateUStoES } from "~/utils/formats";
import { getDiasPeriodo } from "~/components/modals/customs/SeleccionarLiquidacionModal";
import { TbFileSettingsFilled } from "react-icons/tb";
import { BiSolidReport } from "react-icons/bi";
import { FaBox } from "react-icons/fa6";
import type { IconType } from "react-icons";
import ConfigurarSemanaModal, {
  type ConfigSemanaValues,
} from "~/components/liquidacion/ConfigurarSemanaModal";
import { useModal } from "~/context/ModalContext";
import type { DirtyMap } from "~/utils/prepareUpdatePayload";
import ProcesarFichadas from "~/components/liquidacion/ProcesarFichadas";
import Reportes from "~/components/liquidacion/Reportes";
import Resumen from "~/components/liquidacion/Resumen";
import {
  calcularResumenLiquidacion,
  mapResumenToHistorial,
} from "~/utils/liquidacionCalculos";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Liquidación" },
    { name: "description", content: "Liquidación" },
  ];
}

type TabsTypes = "fichadas" | "produccion" | "resumen";

export default function Liquidacion() {
  const {
    liquidaciones,
    updateLiquidacion,
    employees,
    premios,
    saldoEmpleados,
    historial,
    CUDHistorial,
  } = useRRHH();
  const { liquidacionId } = useParams();
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
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
  const isReadOnly = liquidacion?.status === "completada";

  const handleSaveConfig = async (config: ConfigSemanaValues) => {
    if (!liquidacion) return;
    setIsSavingConfig(true);
    openModal("loading", {
      props: {
        title: "Guardando configuración",
      },
    });
    try {
      const result = await updateLiquidacion(
        { ...liquidacion, ...config } as Liquidacion,
        {
          bono_quincenal: true,
          dias_lluvia: true,
          dias_no_laborables: true,
        } as DirtyMap<Liquidacion>,
      );
      if (!result.success) {
        throw new Error(
          result.error ||
            result.message ||
            "No se pudo guardar la configuración",
        );
      }
      closeModal();
      setIsConfigOpen(false);
      openModal("success", {
        props: {
          title: "Configuración guardada",
          message: "La configuración de la semana se actualizó correctamente",
        },
      });
    } catch (error) {
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Hubo un error al guardar la configuración. Inténtalo de nuevo.",
        },
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const ButtonConfSemana = () => (
    <Button
      size="sm"
      color="indigo"
      outline
      onClick={() => setIsConfigOpen(true)}
    >
      <LuSettings2 className="me-1 size-4" />
      Configurar semana
    </Button>
  );

  const ejecutarCompletar = async (resumen: LiquidacionResumen[]) => {
    if (!liquidacion) return;
    openModal("loading", {
      props: {
        title: "Completando liquidación",
        message: "Guardando el resumen en el historial...",
      },
    });
    try {
      const resultHistorial = await CUDHistorial(
        mapResumenToHistorial(resumen, liquidacion.id),
        liquidacion.id,
      );
      if (!resultHistorial.success) {
        throw new Error(
          resultHistorial.error ||
            resultHistorial.message ||
            "No se pudo guardar el historial",
        );
      }
      const result = await updateLiquidacion(
        { ...liquidacion, status: "completada" },
        { status: true } as DirtyMap<Liquidacion>,
      );
      if (!result.success) {
        throw new Error(
          result.error ||
            result.message ||
            "No se pudo actualizar el status",
        );
      }
      closeModal();
      openModal("success", {
        props: {
          title: "Liquidación completada",
          message:
            "El resumen se guardó en el historial y la liquidación quedó como Completada.",
        },
      });
    } catch (error) {
      openModal("error", {
        props: {
          title: "Error al completar",
          message:
            error instanceof Error
              ? error.message
              : "Hubo un error al completar la liquidación. Inténtalo de nuevo.",
        },
      });
    }
  };

  const handleCompletarLiquidacion = () => {
    if (!liquidacion) return;
    const pendientesSalida = fichadasGuardadas.filter((f) => !f.salida).length;
    if (pendientesSalida > 0) {
      openModal("error", {
        props: {
          title: "No se puede completar",
          message: `Faltan completar salidas: ${pendientesSalida} fichada${pendientesSalida === 1 ? "" : "s"} sin hora de salida.`,
        },
      });
      return;
    }
    const resumen = calcularResumenLiquidacion({
      liquidacion,
      employees,
      premios,
      fichadas: fichadasGuardadas,
      reportes: reportesGuardados,
      saldoEmpleados,
      liquidaciones,
      historial,
    });
    if (resumen.length === 0) {
      openModal("error", {
        props: {
          title: "No se puede completar",
          message:
            "No hay empleados activos para generar el resumen de la liquidación.",
        },
      });
      return;
    }
    openModal("confirmation", {
      props: {
        title: "Completar liquidación",
        message:
          "Se guardará el resumen en el historial y la liquidación quedará como Completada. Esta acción se puede deshacer desde el historial.",
        confirmText: "Completar liquidación",
        cancelText: "Cancelar",
        onConfirm: () => void ejecutarCompletar(resumen),
      },
    });
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
                  <Badge
                    color={liquidacion.bono_quincenal ? "purple" : "gray"}
                    className="ms-1"
                  >
                    {liquidacion.bono_quincenal
                      ? "Bono quincenal"
                      : "Semanal"}
                  </Badge>
                </span>
                <span className="text-xs text-base-500 dark:text-base-400">
                  {dias
                    ? `Periodo de ${dias} día${dias === 1 ? "" : "s"}`
                    : "Periodo"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {!isReadOnly && <ButtonConfSemana />}
              <span className="text-xs uppercase tracking-tight font-semibold text-base-500">
                Status
              </span>
              <BadgeStatusLiq status={liquidacion.status} />
              {liquidacion.status === "nueva" && (
                <Button size="sm" color="green" onClick={handleCompletarLiquidacion}>
                  <LuCheckCheck className="me-1 size-4" />
                  Completar liquidación
                </Button>
              )}
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
              <ProcesarFichadas
                liquidacion={liquidacion}
                liquidacionId={liquidacionId}
                readOnly={isReadOnly}
              />
            )}
            {activeTab === 1 && (
              <Reportes
                liquidacion={liquidacion}
                liquidacionId={liquidacionId}
                fichadasGuardadas={fichadasGuardadas}
                reportesGuardados={reportesGuardados}
                readOnly={isReadOnly}
              />
            )}
            {activeTab === 2 && (
              <Resumen
                liquidacion={liquidacion}
                liquidacionId={liquidacionId}
                fichadasGuardadas={fichadasGuardadas}
                reportesGuardados={reportesGuardados}
                readOnly={isReadOnly}
              />
            )}
          </TabItem>
        ))}
      </Tabs>

      <ConfigurarSemanaModal
        show={isConfigOpen}
        liquidacion={liquidacion ?? null}
        isSaving={isSavingConfig}
        onSave={handleSaveConfig}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
}
