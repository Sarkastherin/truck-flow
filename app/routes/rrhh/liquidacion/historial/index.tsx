import type { Route } from "../../../+types/home";
import { useEffect, useMemo } from "react";
import { NavLink } from "react-router";
import { Card } from "flowbite-react";
import { LuCalendarDays, LuCheckCheck } from "react-icons/lu";
import { useRRHH } from "~/context/RRHHContext";
import { SubTitles } from "~/components/SubTitles";
import { LoadingComponent } from "~/components/LoadingComponent";
import { formatCurrency, formatDateUStoES } from "~/utils/formats";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Historial de liquidaciones" },
    { name: "description", content: "Historial de liquidaciones completadas" },
  ];
}

type HistorialCard = {
  liquidacionId: string;
  desde: string | null;
  hasta: string | null;
  fechaCompletada: string;
  total: number;
};

export default function HistorialLiquidaciones() {
  const { historial, liquidaciones, isReady, getSueldosData } = useRRHH();

  useEffect(() => {
    if (!isReady) getSueldosData();
  }, [isReady, getSueldosData]);

  const cards = useMemo<HistorialCard[]>(() => {
    const grouped = historial.reduce(
      (acc, row) => {
        if (!row.liquidacion_id) return acc;
        if (!acc[row.liquidacion_id]) {
          acc[row.liquidacion_id] = {
            liquidacionId: row.liquidacion_id,
            fechaCompletada: row.created_at || "",
            total: 0,
          };
        }
        acc[row.liquidacion_id].total += Number(row.total) || 0;
        if ((row.created_at || "") > acc[row.liquidacion_id].fechaCompletada) {
          acc[row.liquidacion_id].fechaCompletada = row.created_at || "";
        }
        return acc;
      },
      {} as Record<
        string,
        {
          liquidacionId: string;
          fechaCompletada: string;
          total: number;
        }
      >,
    );

    return Object.values(grouped)
      .map((group) => {
        const liq = liquidaciones.find((l) => l.id === group.liquidacionId);
        return {
          ...group,
          desde: liq?.desde ?? null,
          hasta: liq?.hasta ?? null,
          total: Math.round(group.total * 100) / 100,
        };
      })
      .sort((a, b) => {
        const fechaA = a.fechaCompletada || a.desde || "";
        const fechaB = b.fechaCompletada || b.desde || "";
        return fechaB.localeCompare(fechaA);
      });
  }, [historial, liquidaciones]);

  if (!isReady) return <LoadingComponent message="Obteniendo datos..." />;

  return (
    <>
      <SubTitles
        title="Historial de liquidaciones"
        back_path="/rrhh"
        icon={{
          component: LuCheckCheck,
          color: "text-green-600 dark:text-green-400",
        }}
      />
      {cards.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-base-300 py-12 text-center dark:border-base-600">
          <p className="text-sm font-semibold text-base-500 dark:text-base-400">
            No hay liquidaciones completadas
          </p>
          <p className="mt-1 text-sm text-base-500 dark:text-base-400">
            Cuando completes una liquidación, aparecerá acá con su resumen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 auto-rows-fr">
          {cards.map((card) => (
            <NavLink
              key={card.liquidacionId}
              to={`/rrhh/liquidacion/historial/${card.liquidacionId}`}
            >
              <Card className="hover:shadow-2xl hover:scale-105 hover:bg-base-50 dark:hover:bg-base-800 transition-all duration-200 h-full flex flex-col cursor-pointer">
                <div className="flex items-start gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-emerald-500 text-white shadow-sm shadow-green-500/30">
                    <LuCalendarDays className="size-6" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-semibold text-base-800 dark:text-base-100">
                      {card.desde && card.hasta
                        ? `${formatDateUStoES(card.desde)} → ${formatDateUStoES(card.hasta)}`
                        : "Periodo no disponible"}
                    </span>
                    <span className="text-xs text-base-500 dark:text-base-400">
                      {card.fechaCompletada
                        ? `Completada el ${formatDateUStoES(card.fechaCompletada)}`
                        : "Liquidación completada"}
                    </span>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-base-200 pt-3 dark:border-base-700">
                  <span className="text-xs uppercase tracking-tight font-semibold text-base-500">
                    Total
                  </span>
                  <span className="font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(card.total)}
                  </span>
                </div>
              </Card>
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
}
