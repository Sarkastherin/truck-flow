import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
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
import { Button, Card } from "flowbite-react";
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
    <Card className="rounded-2xl max-w-sm">
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col items-start gap-1">
          <span className="tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400 text-xs md:text-sm">
            {label}
          </span>
          <span className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {value}
          </span>
        </div>
        <span className={`p-2 rounded-lg ${accent}`}>
          <Icon className="size-6 md:size-7" />
        </span>
      </div>
    </Card>
  );
}

export default function HomeAdmin() {
  const navigate = useNavigate();
  const { carroceriasUsadas, getCarroceriasUsadasData } =
    useCarroceriasUsadas();
  const { pedidos, getPedidosData } = usePedido();
  const { ctasCorrientesData, getAdministracionData } = useAdministracion();
  const dashboardActions: DashboardAction[] = [
    {
      title: "Nuevo pedido",
      description: "Inicia una nueva venta y registra la unidad en produccion.",
      to: "/pedidos/nuevo",
      icon: LuFilePlus2,
      accent:
        "from-blue-500/20 via-cyan-500/10 to-transparent text-blue-600 dark:text-blue-300",
    },
    {
      title: "Nuevo Movimiento",
      description:
        "Accede al modulo de cuentas corrientes para registrar movimientos.",
      to: "/administracion/cuentas-corrientes?openNuevoMovimiento=true",
      icon: LuWalletCards,
      accent:
        "from-emerald-500/20 via-teal-500/10 to-transparent text-emerald-600 dark:text-emerald-300",
    },
    {
      title: "Gestion de cheques",
      description:
        "Consulta, controla y actualiza el estado de los cheques cargados.",
      to: "/administracion/cheques",
      icon: LuBriefcaseBusiness,
      accent:
        "from-amber-500/20 via-orange-500/10 to-transparent text-amber-600 dark:text-amber-300",
    },
  ];
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
  const mesActual = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

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
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return pedidos
      .filter((pedido) => {
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
      })
      .sort((a, b) => getPedidoSortValue(b) - getPedidoSortValue(a))
      .slice(0, 4);
  }, [pedidos]);
  const movementTypeLabels: Record<string, string> = {
    deuda: "Deuda",
    pago: "Pago",
    nota_credito: "Nota de credito",

  };

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
  const SELLER_RETURN_ALERT_DAYS = 7;
  useEffect(() => {
    if (!carroceriasUsadas) {
      void getCarroceriasUsadasData();
    }
    if (!pedidos) {
      void getPedidosData();
    }
  }, [carroceriasUsadas, getCarroceriasUsadasData, pedidos, getPedidosData]);
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

  return (
    <>
      {/* HEADER */}
      <span className="tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400 text-xs md:text-sm">
        panel de administrador
      </span>
      {/* ACCESOS RÁPIDOS */}
      <span className="text-lg font-semibold text-gray-900 dark:text-white">
        Accesos rápidos
      </span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {dashboardActions.map((action) => (
          <Button
            color="light"
            key={action.title}
            onClick={() => navigate(action.to)}
            size="sm"
            className={`justify-start rounded-lg ${action.accent} py-6 px-4`}
          >
            <action.icon className="mr-2 size-4 md:size-5" />
            {action.title}
          </Button>
        ))}
      </div>
      {/* UNIDADES VENDIDAS*/}
      <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col items-start gap-2">
            <span className="tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400 text-xs md:text-sm">
              UNIDADAS VENDIDAS
            </span>
            <p className="mt-2 text-4xl font-semibold text-gray-900 dark:text-white">
              {unidadesVendidasMes}
            </p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Pedidos generados en {mesActual}.
            </p>
          </div>
          <span
            className={`p-2 rounded-lg bg-green-500/20 text-green-600 dark:text-green-300`}
          >
            <LuCircleDollarSign className="size-6 md:size-7" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-4">
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
                    {pedido.cliente?.razon_social || "Cliente sin asignar"}
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
      {/* ULTIMOS MOVIMIENTOS */}
      <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col items-start gap-2">
            <span className="tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400 text-xs md:text-sm">
              Cuenta corriente
            </span>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Ultimos 5 movimientos cargados
            </span>
          </div>
          <span
            className={`p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-300`}
          >
            <LuWalletCards className="size-6 md:size-7" />
          </span>
        </div>
        <div className="mt-4 ">
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
                        <p className={`text-lg font-semibold ${importeColor}`}>
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
                {false
                  ? "Cargando movimientos recientes..."
                  : "Todavia no hay movimientos cargados para mostrar."}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
