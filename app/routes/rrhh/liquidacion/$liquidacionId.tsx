import { useMemo, useState, useRef } from "react";
import type { Route } from "../../+types/home";
import { useParams } from "react-router";
import { useRRHH } from "~/context/RRHHContext";
import { Button, Card, TabItem, Tabs, type TabsRef } from "flowbite-react";
import { LuArrowRight, LuCalendarDays, LuSettings2 } from "react-icons/lu";
import type { Liquidacion } from "~/types/liquidaciones";
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
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Liquidación" },
    { name: "description", content: "Liquidación" },
  ];
}

type TabsTypes = "fichadas" | "produccion" | "resumen";

export default function Liquidacion() {
  const { liquidaciones, updateLiquidacion } = useRRHH();
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
          horas_semanales: true,
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
            <div className="flex shrink-0 items-center gap-3">
              <ButtonConfSemana />
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
              <ProcesarFichadas
                liquidacion={liquidacion}
                liquidacionId={liquidacionId}
              />
            )}
            {activeTab === 1 && (
              <Reportes
                liquidacion={liquidacion}
                liquidacionId={liquidacionId}
                fichadasGuardadas={fichadasGuardadas}
                reportesGuardados={reportesGuardados}
              />
            )}
            {activeTab === 2 && (
              <Resumen
                liquidacion={liquidacion}
                liquidacionId={liquidacionId}
                fichadasGuardadas={fichadasGuardadas}
                reportesGuardados={reportesGuardados}
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
