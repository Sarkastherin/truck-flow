import type { Route } from "../../../+types/home";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Badge, Button, Card } from "flowbite-react";
import {
  LuArrowRight,
  LuCalendarDays,
  LuCheckCheck,
  LuRotateCcw,
} from "react-icons/lu";
import type { TableColumn } from "react-data-table-component";
import { useRRHH } from "~/context/RRHHContext";
import { useModal } from "~/context/ModalContext";
import { SubTitles } from "~/components/SubTitles";
import { LoadingComponent } from "~/components/LoadingComponent";
import TableComponent from "~/components/TableComponentNew";
import { BadgeStatusLiq } from "~/components/specials/Badges";
import { formatCurrency, formatDateUStoES } from "~/utils/formats";
import type { Liquidacion, LiquidacionHistorial } from "~/types/liquidaciones";
import type { DirtyMap } from "~/utils/prepareUpdatePayload";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Historial de liquidación" },
    { name: "description", content: "Detalle de liquidación completada" },
  ];
}

type HistorialRow = LiquidacionHistorial & {
  nombre: string;
  grupo?: string | null;
};

const formatDecimal = (value: number) => {
  const isDecimal = Number.isFinite(value) && value % 1 !== 0;
  return isDecimal ? String(value).replace(".", ",") : value;
};

const columns: TableColumn<HistorialRow>[] = [
  {
    id: "empleado",
    name: "Empleado",
    selector: (row) => row.nombre,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span>{row.nombre}</span>
        {row.grupo && <Badge>{row.grupo}</Badge>}
      </div>
    ),
    sortable: true,
    pinned: "left",
    minWidth: "250px",
  },
  {
    id: "hs_totales",
    name: "HS totales",
    selector: (row) => row.hs_totales,
    format: (row) => formatDecimal(row.hs_totales),
    grow: 0,
    sortable: true,
  },
  {
    id: "hs_feriado",
    name: "HS Feriado",
    selector: (row) => row.hs_feriado,
    format: (row) => formatDecimal(row.hs_feriado),
    grow: 0,
    sortable: true,
  },
  {
    id: "hs_pagadas",
    name: "HS Pagadas",
    selector: (row) => row.hs_pagadas,
    format: (row) => formatDecimal(row.hs_pagadas),
    grow: 0,
    sortable: true,
  },
  {
    id: "hs_regulares",
    name: "HS Reg",
    selector: (row) => row.hs_regulares,
    format: (row) => formatDecimal(row.hs_regulares),
    grow: 0,
    sortable: true,
  },
  {
    id: "hs_extras",
    name: "HS Extras",
    selector: (row) => row.hs_extras,
    format: (row) => formatDecimal(row.hs_extras),
    grow: 0,
    sortable: true,
  },
  {
    id: "salario",
    name: "Salario",
    selector: (row) => row.salario,
    cell: (row) => <span>{formatCurrency(row.salario)}</span>,
    format: (row) => formatDecimal(row.salario),
    grow: 0,
    sortable: true,
  },
  {
    id: "extra",
    name: "Extra",
    selector: (row) => row.extra,
    cell: (row) => <span>{formatCurrency(row.extra)}</span>,
    format: (row) => formatDecimal(row.extra),
    grow: 0,
    sortable: true,
  },
  {
    id: "carrocerias",
    name: "Carrocerías",
    selector: (row) => row.carrocerias,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "faltas",
    name: "Faltas",
    selector: (row) => row.faltas,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "tardanzas",
    name: "Tardanzas",
    selector: (row) => row.tardanzas,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "sal_temprano",
    name: "Sal temp",
    selector: (row) => row.sal_temprano,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "perdidos",
    name: "Perdidos",
    selector: (row) => row.perdidos,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "ganados",
    name: "Ganados",
    selector: (row) => row.ganados,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "recuperados",
    name: "Recuperados",
    selector: (row) => row.recuperados,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "total_premios",
    name: "Total premios",
    selector: (row) => row.total_premios,
    cell: (row) => <span>{formatCurrency(row.total_premios)}</span>,
    format: (row) => formatDecimal(row.total_premios),
    grow: 0,
    sortable: true,
  },
  {
    id: "deuda",
    name: "Deuda",
    selector: (row) => row.deuda,
    cell: (row) => (
      <span className={`${row.deuda > 0 ? "text-red-600" : ""}`}>
        {formatCurrency(row.deuda)}
      </span>
    ),
    format: (row) => formatDecimal(row.deuda),
    grow: 0,
    sortable: true,
  },
  {
    id: "descuento",
    name: "Descuento",
    selector: (row) => row.descuento,
    cell: (row) => (
      <span className={`${row.descuento > 0 ? "text-green-600" : ""}`}>
        {formatCurrency(row.descuento)}
      </span>
    ),
    format: (row) => formatDecimal(row.descuento),
    grow: 0,
    sortable: true,
  },
  {
    id: "saldo",
    name: "Saldo",
    selector: (row) => row.saldo,
    cell: (row) => (
      <span className={`${row.saldo > 0 ? "text-red-600" : ""}`}>
        {formatCurrency(row.saldo)}
      </span>
    ),
    format: (row) => formatDecimal(row.saldo),
    grow: 0,
    sortable: true,
  },
  {
    id: "total",
    name: "Total",
    selector: (row) => row.total,
    cell: (row) => (
      <span className="font-bold">{formatCurrency(row.total)}</span>
    ),
    format: (row) => formatDecimal(row.total),
    minWidth: "110px",
    pinned: "right",
    grow: 0,
    sortable: true,
  },
];

export default function HistorialLiquidacion() {
  const { liquidacionId } = useParams();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const [isReverting, setIsReverting] = useState(false);
  const {
    historial,
    liquidaciones,
    employees,
    isLoading,
    isReady,
    getSueldosData,
    updateLiquidacion,
    removeHistorialByLiquidacion,
  } = useRRHH();

  useEffect(() => {
    if (!isReady) getSueldosData();
  }, [isReady, getSueldosData]);

  const liquidacion = useMemo(
    () => liquidaciones.find((liq) => liq.id === liquidacionId),
    [liquidaciones, liquidacionId],
  );

  const rows = useMemo<HistorialRow[]>(() => {
    return historial
      .filter((row) => row.liquidacion_id === liquidacionId)
      .map((row) => {
        const empleado = employees.find((emp) => emp.id === row.empleado_id);
        return {
          ...row,
          nombre: empleado?.nombre_completo || "Empleado no encontrado",
          grupo: empleado?.grupo,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [historial, liquidacionId, employees]);

  const fechaCompletada = useMemo(() => {
    return rows.reduce(
      (max, row) => ((row.created_at || "") > max ? row.created_at || "" : max),
      "",
    );
  }, [rows]);

  const totalGeneral = useMemo(
    () => rows.reduce((acc, row) => acc + (Number(row.total) || 0), 0),
    [rows],
  );

  const ejecutarRevertir = async () => {
    if (!liquidacionId) return;
    setIsReverting(true);
    openModal("loading", {
      props: {
        title: "Revertiendo liquidación",
        message: "Eliminando el registro del historial...",
      },
    });
    try {
      // 1) El status vuelve a "nueva" primero: si algo falla después, la
      // liquidación sigue siendo editable y la reversión se puede reintentar
      if (liquidacion && liquidacion.status === "completada") {
        const resultStatus = await updateLiquidacion(
          { ...liquidacion, status: "nueva" },
          { status: true } as DirtyMap<Liquidacion>,
        );
        if (!resultStatus.success) {
          throw new Error(
            resultStatus.error ||
              resultStatus.message ||
              "No se pudo actualizar el status",
          );
        }
      }
      // 2) Se eliminan las filas del historial (idempotente)
      const resultHistorial = await removeHistorialByLiquidacion(liquidacionId);
      if (!resultHistorial.success) {
        throw new Error(
          resultHistorial.error ||
            resultHistorial.message ||
            "No se pudo eliminar el historial",
        );
      }
      closeModal();
      navigate("/rrhh/liquidacion/historial");
      openModal("success", {
        props: {
          title: "Liquidación revertida",
          message:
            "La liquidación volvió al estado Nueva y su registro fue eliminado del historial.",
        },
      });
    } catch (error) {
      openModal("error", {
        props: {
          title: "Error al revertir",
          message:
            (error instanceof Error
              ? error.message
              : "Hubo un error al revertir la liquidación.") +
            " Reintentá la reversión.",
        },
      });
    } finally {
      setIsReverting(false);
    }
  };

  const handleRevertir = () => {
    openModal("confirmation", {
      props: {
        title: "Revertir liquidación",
        message:
          "La liquidación volverá al estado Nueva y se eliminará su registro del historial. Los datos de fichadas y producción se conservarán.",
        confirmText: "Revertir a Nueva",
        cancelText: "Cancelar",
        onConfirm: () => void ejecutarRevertir(),
      },
    });
  };

  if (!isReady) return <LoadingComponent message="Obteniendo datos..." />;

  if (!liquidacion && rows.length === 0) {
    return (
      <>
        <SubTitles
          title="Historial de liquidación"
          back_path="/rrhh/liquidacion/historial"
        />
        <div className="mt-6 rounded-lg border-2 border-dashed border-base-300 py-12 text-center dark:border-base-600">
          <p className="text-sm font-semibold text-base-500 dark:text-base-400">
            Liquidación no encontrada
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SubTitles
        title="Historial de liquidación"
        back_path="/rrhh/liquidacion/historial"
        icon={{
          component: LuCheckCheck,
          color: "text-green-600 dark:text-green-400",
        }}
      />
      <Card className="mt-4">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-lime-500 text-white shadow-sm shadow-green-500/30">
              <LuCalendarDays className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5 font-semibold text-base-800 dark:text-base-100">
                {liquidacion?.desde && liquidacion?.hasta ? (
                  <>
                    {formatDateUStoES(liquidacion.desde)}
                    <LuArrowRight className="size-3.5 shrink-0 text-base-400" />
                    {formatDateUStoES(liquidacion.hasta)}
                  </>
                ) : (
                  "Periodo no disponible"
                )}
              </span>
              <span className="text-xs text-base-500 dark:text-base-400">
                {fechaCompletada
                  ? `Completada el ${formatDateUStoES(fechaCompletada)}`
                  : "Liquidación completada"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button
              size="sm"
              color="yellow"
              outline
              onClick={() => navigate(`/rrhh/liquidacion/${liquidacionId}`)}
            >
              <LuArrowRight className="me-1 size-4" />
              Ver fichadas y producción
            </Button>
            <Button
              size="sm"
              color="red"
              outline
              onClick={handleRevertir}
              disabled={isReverting}
            >
              <LuRotateCcw className="me-1 size-4" />
              Revertir a Nueva
            </Button>
            <span className="text-xs uppercase tracking-tight font-semibold text-base-500">
              Status
            </span>
            <BadgeStatusLiq status={liquidacion?.status ?? "completada"} />
          </div>
        </div>
      </Card>
      <div className="mt-2 overflow-x-auto rounded-lg shadow-md">
        <TableComponent
          columns={columns}
          data={rows}
          backPath="/rrhh/liquidacion/historial"
          isLoading={isLoading}
          color="green"
          labelButton=""
          hasActiveColumn={false}
          storageKey={`historial_liquidacion_${liquidacionId}`}
          searchKeys={["nombre"]}
          searchPlaceholder="Buscar por nombre"
          scrollHeightOffset={360}
          showColumnVisibility
          pagination={false}
          message={
            <span className="text-sm font-bold text-green-700 dark:text-green-400">
              Total: {formatCurrency(totalGeneral)}
            </span>
          }
          pointerOnHover={false}
          highlightOnHover={false}
          customTheme={{
            typography: { fontSize: "12px", fontSizeHeader: "13px" },
            spacing: {
              rowHeight: "34px",
              cellPaddingX: "8px",
            },
            text: {
              primary: "#333333",
            },
            background: {
              header: "#ecfccb",
            },
          }}
        />
      </div>
    </>
  );
}
