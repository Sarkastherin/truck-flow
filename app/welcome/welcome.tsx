import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { useAdministracion } from "~/context/AdministracionContext";
import { usePedido } from "~/context/PedidoContext";
import type { Movimientos } from "~/types/cuentas-corrientes";
import type { Pedido } from "~/types/pedido";
import {
  LuBriefcaseBusiness,
  LuCircleDollarSign,
  LuClipboardPlus,
  LuFilePlus2,
  LuWalletCards,
} from "react-icons/lu";
import pkg from "../../package.json";
import { LogoComponent } from "~/components/LogoComponent";
const appVersion = pkg.version;

type DashboardAction = {
  title: string;
  description: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

type DashboardMovimiento = Movimientos & {
  clienteId: string;
  clienteNombre: string;
};

const dashboardActions: DashboardAction[] = [
  {
    title: "Crear nuevo pedido",
    description: "Inicia una nueva venta y registra la unidad en produccion.",
    to: "/pedidos/nuevo",
    icon: LuFilePlus2,
    accent:
      "from-blue-500/20 via-cyan-500/10 to-transparent text-blue-600 dark:text-blue-300",
  },
  {
    title: "Crear nuevo movimiento en Cta Corriente",
    description:
      "Accede al modulo de cuentas corrientes para registrar movimientos.",
    to: "/administracion/cuentas-corrientes?openNuevoMovimiento=true",
    icon: LuWalletCards,
    accent:
      "from-emerald-500/20 via-teal-500/10 to-transparent text-emerald-600 dark:text-emerald-300",
  },
  {
    title: "Ir a gestion de cheques",
    description:
      "Consulta, controla y actualiza el estado de los cheques cargados.",
    to: "/administracion/cheques",
    icon: LuBriefcaseBusiness,
    accent:
      "from-amber-500/20 via-orange-500/10 to-transparent text-amber-600 dark:text-amber-300",
  },
];

const movementTypeLabels: Record<string, string> = {
  deuda: "Deuda",
  pago: "Pago",
  nota_credito: "Nota de credito",
};

export function Welcome() {
  const { pedidos, getPedidosData } = usePedido();
  const { ctasCorrientesData, getAdministracionData } = useAdministracion();
  const [isLoading, setIsLoading] = useState(false);
  const hasRequestedData = useRef(false);
  useEffect(() => {
    if (!pedidos) {
      getPedidosData();
    }
  }, [pedidos, getPedidosData]);
  useEffect(() => {
    if (hasRequestedData.current) {
      return;
    }

    hasRequestedData.current = true;
    setIsLoading(true);

    void Promise.all([
      pedidos === null ? getPedidosData() : Promise.resolve(),
      ctasCorrientesData.length === 0
        ? getAdministracionData()
        : Promise.resolve(),
    ]).finally(() => {
      setIsLoading(false);
    });
  }, [
    ctasCorrientesData.length,
    getAdministracionData,
    getPedidosData,
    pedidos,
  ]);

  const unidadesVendidasMes = useMemo(() => {
    if (!pedidos) {
      return 0;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return pedidos.filter((pedido) => {
      if (
        !pedido.fecha_pedido ||
        pedido.active === false ||
        pedido.status === "cancelado"
      ) {
        return false;
      }

      const fechaPedido = new Date(`${pedido.fecha_pedido}T00:00:00`);

      return (
        !Number.isNaN(fechaPedido.getTime()) &&
        fechaPedido.getMonth() === currentMonth &&
        fechaPedido.getFullYear() === currentYear
      );
    }).length;
  }, [pedidos]);

  const ultimosMovimientos = useMemo<DashboardMovimiento[]>(() => {
    return ctasCorrientesData
      .flatMap((cta) =>
        cta.movimientos.map((movimiento) => ({
          ...movimiento,
          clienteId: cta.cliente.id,
          clienteNombre: cta.cliente.razon_social,
        })),
      )
      .filter((movimiento) => movimiento.active !== false)
      .sort((a, b) => getMovementSortValue(b) - getMovementSortValue(a))
      .slice(0, 5);
  }, [ctasCorrientesData]);

  const pedidosRecientes = useMemo<Pedido[]>(() => {
    if (!pedidos) {
      return [];
    }

    return [...pedidos]
      .filter((pedido) => pedido.active !== false)
      .sort((a, b) => getPedidoSortValue(b) - getPedidoSortValue(a))
      .slice(0, 3);
  }, [pedidos]);

  const mesActual = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-[calc(100vh-7rem)] py-4 md:py-6">
      <section className="overflow-hidden rounded-4xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%)] p-6 dark:border-gray-800 md:p-8">
          <span className="inline-flex items-center rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 backdrop-blur dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
            Dashboard operativo
          </span>
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.15fr] lg:items-stretch">
            <div className="space-y-3">
              <div className="space-y-3">
                <div className="hidden">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                    Accesos rapidos
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    Operaciones frecuentes
                  </h2>
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                  Accesos rapidos
                </p>
                <div className="flex flex-col gap-3">
                  {dashboardActions.map(
                    ({ title, description, to, icon: Icon, accent }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className="group rounded-[1.35rem] border border-gray-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                      >
                        <div
                          className={`rounded-[1.1rem] bg-linear-to-br p-3 ${accent}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-5 w-5" />
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white md:text-[15px]">
                              {title}
                            </h3>
                          </div>

                          <p className="hidden text-xs leading-5 text-gray-600 dark:text-gray-300">
                            {description}
                          </p>
                        </div>
                      </NavLink>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50/90 p-5 shadow-inner dark:border-gray-800 dark:bg-gray-900/90">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Unidades vendidas
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-gray-900 dark:text-white">
                    {isLoading && pedidos === null
                      ? "..."
                      : unidadesVendidasMes}
                  </p>
                </div>
                <span className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <LuCircleDollarSign className="h-6 w-6" />
                </span>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Pedidos generados en {mesActual}.
              </p>
              <div className="mt-6 space-y-3">
                {pedidosRecientes.length > 0 ? (
                  pedidosRecientes.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {pedido.numero_pedido}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {pedido.cliente?.razon_social ||
                            "Cliente sin asignar"}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {formatDateUStoES(pedido.fecha_pedido)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    No hay pedidos recientes para mostrar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:p-8">
          <section className="rounded-[1.75rem] border border-gray-200 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-900/40 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                  Cuenta corriente
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  Ultimos 5 movimientos cargados
                </h2>
              </div>
              <span className="inline-flex rounded-2xl bg-gray-900 p-3 text-white dark:bg-white dark:text-gray-900">
                <LuClipboardPlus className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {ultimosMovimientos.length > 0 ? (
                ultimosMovimientos.map((movimiento) => {
                  const importe =
                    movimiento.haber > 0 ? movimiento.haber : movimiento.debe;
                  const importeColor =
                    movimiento.tipo_movimiento === "deuda"
                      ? "text-rose-600 dark:text-rose-300"
                      : "text-emerald-600 dark:text-emerald-300";

                  return (
                    <NavLink
                      key={movimiento.id}
                      to={`/administracion/cuentas-corrientes/${movimiento.clienteId}`}
                      className="block rounded-[1.25rem] border border-gray-200 bg-white px-4 py-4 transition hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {movementTypeLabels[movimiento.tipo_movimiento] ??
                                movimiento.tipo_movimiento}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateUStoES(movimiento.fecha_movimiento)}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-base font-semibold text-gray-900 dark:text-white">
                            {movimiento.clienteNombre}
                          </p>
                          <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                            {movimiento.concepto || "Sin concepto cargado"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`text-lg font-semibold ${importeColor}`}
                          >
                            {importe.toLocaleString("es-AR", {
                              style: "currency",
                              currency: "ARS",
                            })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {movimiento.medio_pago === "no_aplica"
                              ? "Sin medio de pago"
                              : movimiento.medio_pago.replaceAll("_", " ")}
                          </p>
                        </div>
                      </div>
                    </NavLink>
                  );
                })
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                  {isLoading
                    ? "Cargando movimientos recientes..."
                    : "Todavia no hay movimientos cargados para mostrar."}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
      <footer>
        <div className="flex items-center justify-center gap-2 mt-6 text-center text-sm text-gray-500 dark:text-gray-400 scale-75">
          <LogoComponent />
          <span>- Versión {appVersion}</span>
        </div>
      </footer>
    </main>
  );
}

function getMovementSortValue(
  movimiento: Pick<Movimientos, "created_at" | "fecha_movimiento">,
) {
  return (
    getSortValue(movimiento.created_at) ||
    getSortValue(movimiento.fecha_movimiento)
  );
}

function getPedidoSortValue(
  pedido: Pick<Pedido, "created_at" | "fecha_pedido">,
) {
  return getSortValue(pedido.created_at) || getSortValue(pedido.fecha_pedido);
}

function getSortValue(date?: string) {
  if (!date) {
    return 0;
  }

  const normalizedDate = date.includes("T") ? date : `${date}T00:00:00`;
  const parsedDate = new Date(normalizedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }

  return parsedDate.getTime();
}
