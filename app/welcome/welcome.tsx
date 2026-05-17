import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { useAdministracion } from "~/context/AdministracionContext";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { usePedido } from "~/context/PedidoContext";
import { BadgeStatusCarroceriaUsada } from "~/components/specials/Badges";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import type { Movimientos } from "~/types/cuentas-corrientes";
import type { Pedido } from "~/types/pedido";
import {
  LuArrowRight,
  LuBriefcaseBusiness,
  LuCircleDollarSign,
  LuCircleAlert,
  LuClipboardPlus,
  LuFilePlus2,
  LuPackageSearch,
  LuCalendarClock,
  LuPlus,
  LuTruck,
  LuWalletCards,
} from "react-icons/lu";
import pkg from "../../package.json";
import { LogoComponent } from "~/components/LogoComponent";
import { useUser } from "~/context/UserContext";
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

const SELLER_RETURN_ALERT_DAYS = 7;

export function Welcome() {
  const { activeUser } = useUser();
  const { pedidos, getPedidosData } = usePedido();
  const { ctasCorrientesData, getAdministracionData } = useAdministracion();
  const { carroceriasUsadas, getCarroceriasUsadasData } =
    useCarroceriasUsadas();
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

  useEffect(() => {
    if (activeUser?.role !== "SELLER" || carroceriasUsadas) {
      return;
    }

    void getCarroceriasUsadasData();
  }, [activeUser?.role, carroceriasUsadas, getCarroceriasUsadasData]);

  const sellerInventory = useMemo(() => {
    if (!carroceriasUsadas) {
      return {
        available: [] as CarroceriaUsadaData[],
        sold: [] as CarroceriaUsadaData[],
        borrowed: [] as CarroceriaUsadaData[],
        dueSoon: [] as CarroceriaUsadaData[],
        overdue: [] as CarroceriaUsadaData[],
        withoutDueDate: [] as CarroceriaUsadaData[],
      };
    }

    const available = carroceriasUsadas.filter(
      (carroceria) => carroceria.status === "disponible",
    );
    const sold = carroceriasUsadas.filter(
      (carroceria) => carroceria.status === "vendida",
    );
    const borrowed = carroceriasUsadas.filter(
      (carroceria) => carroceria.status === "prestada",
    );

    const borrowedWithReturnDate = borrowed.filter(
      (carroceria) => carroceria.prestamo?.fecha_devolucion_estimada,
    );

    const overdue = borrowedWithReturnDate.filter((carroceria) => {
      const returnDays = getDaysUntil(
        carroceria.prestamo?.fecha_devolucion_estimada,
      );

      return returnDays !== null && returnDays < 0;
    });

    const dueSoon = borrowedWithReturnDate
      .filter((carroceria) => {
        const returnDays = getDaysUntil(
          carroceria.prestamo?.fecha_devolucion_estimada,
        );

        return (
          returnDays !== null &&
          returnDays >= 0 &&
          returnDays <= SELLER_RETURN_ALERT_DAYS
        );
      })
      .sort(
        (a, b) =>
          getSortValue(a.prestamo?.fecha_devolucion_estimada) -
          getSortValue(b.prestamo?.fecha_devolucion_estimada),
      );

    const withoutDueDate = borrowed.filter(
      (carroceria) => !carroceria.prestamo?.fecha_devolucion_estimada,
    );

    return {
      available,
      sold,
      borrowed,
      dueSoon,
      overdue,
      withoutDueDate,
    };
  }, [carroceriasUsadas]);

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

  const isSeller = activeUser?.role === "SELLER";

  return (
    <main className="mt-8">
      <section className="overflow-hidden rounded-4xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%)] p-6 dark:border-gray-800 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 backdrop-blur dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
                {isSeller ? "Panel de vendedor" : "Dashboard operativo"}
              </span>
             
            </div>
            {isSeller ? (
              <div className="flex flex-wrap gap-3">
                <NavLink
                  to="/carrocerias-usadas"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:border-gray-700"
                >
                  <LuPackageSearch className="h-4 w-4" />
                  Ver inventario
                </NavLink>
                <NavLink
                  to="/carrocerias-usadas/nueva"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  <LuPlus className="h-4 w-4" />
                  Cargar usada
                </NavLink>
              </div>
            ) : null}
          </div>
          {isSeller ? (
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <StatCard
                label="Disponibles"
                value={sellerInventory.available.length}
                icon={LuTruck}
                accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              />
              <StatCard
                label="Prestadas"
                value={sellerInventory.borrowed.length}
                icon={LuClipboardPlus}
                accent="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
              />
              <StatCard
                label="Vendidas"
                value={sellerInventory.sold.length}
                icon={LuCircleDollarSign}
                accent="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
              />
              <StatCard
                label="Próximas a devolver"
                value={sellerInventory.dueSoon.length + sellerInventory.overdue.length}
                icon={LuCircleAlert}
                accent="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
              />
            </div>
          ) : null}
          {!isSeller && (
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
          )}
          {isSeller && (
            <div className="grid gap-6 p-6 md:p-8">
              <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-900/40 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Alertas de devolución
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        Próximas a devolver o vencidas
                      </h2>
                    </div>
                    <span className="inline-flex rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      <LuCalendarClock className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    {sellerInventory.overdue.length > 0 ||
                    sellerInventory.dueSoon.length > 0 ? (
                      [...sellerInventory.overdue, ...sellerInventory.dueSoon].map(
                        (carroceria) => {
                          const dias = getDaysUntil(
                            carroceria.prestamo?.fecha_devolucion_estimada,
                          );

                          return (
                            <NavLink
                              key={carroceria.id}
                              to={`/carrocerias-usadas/${carroceria.id}`}
                              className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-gray-200 bg-white px-4 py-4 transition hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {carroceria.numero_carroceria}
                                  </p>
                                  <BadgeStatusCarroceriaUsada
                                    status={carroceria.status}
                                  />
                                </div>
                                <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                                  {carroceria.tipo_carrozado ||
                                    "Sin tipo de carrozado"}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {dias === null
                                    ? "Sin fecha"
                                    : dias < 0
                                      ? `Vencida hace ${Math.abs(dias)} d`
                                      : `Devuelve en ${dias} d`}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {carroceria.prestamo?.fecha_devolucion_estimada
                                    ? formatDateUStoES(
                                        carroceria.prestamo
                                          .fecha_devolucion_estimada,
                                      )
                                    : "Sin fecha estimada"}
                                </p>
                              </div>
                            </NavLink>
                          );
                        },
                      )
                    ) : (
                      <div className="rounded-[1.25rem] border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                        {carroceriasUsadas
                          ? "No hay carrocerías con devolución próxima."
                          : "Cargando carrocerías usadas..."}
                      </div>
                    )}
                  </div>

                  {sellerInventory.withoutDueDate.length > 0 && (
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      {sellerInventory.withoutDueDate.length} prestadas sin fecha
                      de devolución cargada.
                    </p>
                  )}
                </div>

                <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-900/40 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                        Stock operativo
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                        Últimas unidades
                      </h2>
                    </div>
                    <span className="inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <LuPackageSearch className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    {(carroceriasUsadas ?? []).slice(0, 6).map((carroceria) => (
                      <NavLink
                        key={carroceria.id}
                        to={`/carrocerias-usadas/${carroceria.id}`}
                        className="block rounded-[1.25rem] border border-gray-200 bg-white px-4 py-4 transition hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {carroceria.numero_carroceria}
                              </p>
                              <BadgeStatusCarroceriaUsada
                                status={carroceria.status}
                              />
                            </div>
                            <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                              {carroceria.tipo_carrozado || "Sin tipo de carrozado"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {carroceria.duenno?.razon_social ||
                                "Sin propietario asociado"}
                            </p>
                          </div>
                          <LuArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                        </div>
                      </NavLink>
                    ))}
                    {(carroceriasUsadas?.length ?? 0) === 0 && carroceriasUsadas ? (
                      <div className="rounded-[1.25rem] border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                        No hay carrocerías cargadas para mostrar.
                      </div>
                    ) : null}
                    {!carroceriasUsadas ? (
                      <div className="rounded-[1.25rem] border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
                        Cargando inventario...
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
        {activeUser?.role !== "SELLER" && (
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
                                {movementTypeLabels[
                                  movimiento.tipo_movimiento
                                ] ?? movimiento.tipo_movimiento}
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
        )}
      </section>
      <footer>
        <div className="flex items-center justify-center gap-2 mt-6 text-center text-sm text-gray-500 dark:text-gray-400 scale-75">
          <LogoComponent />
          <span>- Versión {appVersion}</span>
        </div>
        <div className="text-xs text-center">
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
            Política de Privacidad
          </a>
          <span> | </span>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">
            Términos y Condiciones
          </a>
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

function getDaysUntil(date?: string) {
  if (!date) {
    return null;
  }

  const normalizedDate = date.includes("T") ? date : `${date}T00:00:00`;
  const parsedDate = new Date(normalizedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = parsedDate.getTime() - today.getTime();

  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <span className={`inline-flex rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
