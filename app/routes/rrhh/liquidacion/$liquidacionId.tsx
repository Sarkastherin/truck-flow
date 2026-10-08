import { useMemo } from "react";
import type { Route } from "../../+types/home";
import { useParams } from "react-router";
import { useRRHH } from "~/context/RRHHContext";
import { Card } from "flowbite-react";
import { LuArrowRight, LuCalendarDays, LuChevronRight } from "react-icons/lu";
import type { Liquidacion } from "~/types/liquidaciones";
import { BadgeStatusLiq } from "~/components/specials/Badges";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { getDiasPeriodo } from "~/components/modals/customs/SeleccionarLiquidacionModal";
import { NavLink } from "react-router";
import { TbFileSettingsFilled} from "react-icons/tb";
import { BiSolidReport } from "react-icons/bi";
import { FaBox } from "react-icons/fa6";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Liquidación" },
    { name: "description", content: "Liquidación" },
  ];
}
export default function Liquidacion() {
  const { liquidaciones } = useRRHH();
  const { liquidacionId } = useParams();
  const liquidacion = useMemo(() => {
    return liquidaciones.find((liq) => liq.id === liquidacionId);
  }, [liquidaciones]);
  const dias = liquidacion
    ? getDiasPeriodo(liquidacion.desde, liquidacion.hasta)
    : null;
  const items = [
    {
      path: `/rrhh/liquidacion/${liquidacionId}1`,
      name: "Procesar Fichadas",
      description:
        "Ingresa el archivo de fichadas para calcular horas trabajadas",
      icon: {
        component: TbFileSettingsFilled,
        color: "text-yellow-600 dark:text-yellow-400",
      },
    },
    {
      path: `/rrhh/liquidacion/${liquidacionId}2`,
      name: "Producción",
      description:
        "Registra los trabajos elaborados por empleado para obtener el calculo de PREMIOS",
      icon: {
        component: FaBox,
        color: "text-lime-600 dark:text-lime-400",
      },
    },
    {
      path: `/rrhh/liquidacion/${liquidacionId}3`,
      name: "Reporte y resumen",
      description:
        "Obten el resumen de la liquidación del periodo en curso",
      icon: {
        component: BiSolidReport,
        color: "text-blue-600 dark:text-blue-400",
      },
    },
  ];
  return (
    <>
      <Card>
        {liquidacion && (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-500 text-white shadow-sm shadow-violet-500/30">
                <LuCalendarDays className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-100">
                  {formatDateUStoES(liquidacion.desde)}
                  <LuArrowRight className="size-3.5 shrink-0 text-gray-400" />
                  {formatDateUStoES(liquidacion.hasta)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {dias
                    ? `Periodo de ${dias} día${dias === 1 ? "" : "s"}`
                    : "Periodo"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs uppercase tracking-tight font-semibold text-gray-500">
                Status
              </span>
              <BadgeStatusLiq status={liquidacion.status} />
            </div>
          </div>
        )}
      </Card>
      <div className="mt-10 grid grid-cols-3 gap-6">
        {items.map(
          ({ path, name, description, icon: { component: Icon, color } }) => (
            <NavLink key={path} to={path}>
              <Card className="hover:shadow-2xl hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 h-full flex flex-col cursor-pointer">
                <div className="flex items-center space-x-4">
                  <Icon className={`text-2xl ${color}`} />
                  <h2 className="text-xl font-semibold">{name}</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </Card>
            </NavLink>
          ),
        )}
      </div>
    </>
  );
}
