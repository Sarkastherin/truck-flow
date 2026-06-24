import { useEffect, useMemo} from "react";
import { NavLink, useNavigate } from "react-router";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { BadgeStatusCarroceriaUsada } from "~/components/specials/Badges";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import {
  LuArrowRight,
  LuCircleDollarSign,
  LuCircleAlert,
  LuClipboardPlus,
  LuPackageSearch,
  LuPlus,
  LuTruck,
} from "react-icons/lu";
import { Button, Card } from "flowbite-react";

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

export default function HomeSeller() {
  const navigate = useNavigate();
  const { carroceriasUsadas, getCarroceriasUsadasData } =
    useCarroceriasUsadas();
  const SELLER_RETURN_ALERT_DAYS = 7;

  useEffect(() => {
    if (!carroceriasUsadas) {
      void getCarroceriasUsadasData();
    }
  }, [carroceriasUsadas, getCarroceriasUsadasData]);
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
      <div className="flex gap-y-4 justify-between items-center">
        <span className="tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400 text-xs md:text-sm">
          panel de vendedor
        </span>
        <div className="flex gap-2">
          <Button
            color="light"
            title="Ver inventario completo"
            onClick={() => navigate("/carrocerias-usadas")}
          >
            <LuPackageSearch className="md:mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Ver inventario</span>
          </Button>
          <Button
            color="dark"
            title="Agregar nueva unidad"
            onClick={() => navigate("/carrocerias-usadas/nueva")}
          >
            <LuPlus className="md:mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Nueva unidad</span>
          </Button>
        </div>
      </div>
      {/* KPI PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard
          label="disponibles"
          value={sellerInventory.available.length}
          icon={LuTruck}
          accent="bg-green-500/20 text-green-600 dark:text-green-300"
        />
        <StatCard
          label="prestadas"
          value={sellerInventory.borrowed.length}
          icon={LuClipboardPlus}
          accent="bg-yellow-300/30 text-yellow-600 dark:text-yellow-300"
        />
        <StatCard
          label="vendidas"
          value={sellerInventory.sold.length}
          icon={LuCircleDollarSign}
          accent="bg-red-500/20 text-red-600 dark:text-red-300"
        />
        <StatCard
          label="proximas a devolver"
          value={sellerInventory.dueSoon.length}
          icon={LuCircleAlert}
          accent="bg-blue-500/20 text-blue-600 dark:text-blue-300"
        />
      </div>
      {/* STOCK OPERATIVO */}
      <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col items-start gap-2">
            <span className="tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400 text-xs md:text-sm">
              Stock operativo
            </span>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Últimas unidades
            </span>
          </div>
          <span
            className={`p-2 rounded-lg bg-green-500/20 text-green-600 dark:text-green-300`}
          >
            <LuPackageSearch className="size-6 md:size-7" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-4">
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
                    <BadgeStatusCarroceriaUsada status={carroceria.status} />
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
    </>
  );
}
