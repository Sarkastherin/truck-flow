import { useEffect, useMemo, useState } from "react";
import { useRRHH } from "~/context/RRHHContext";
import type { Liquidacion, LiquidacionResumen } from "~/types/liquidaciones";
import { calcularResumenLiquidacion } from "~/utils/liquidacionCalculos";
import { useTableExport, type TableColumn } from "react-data-table-component";
import TableComponent from "~/components/TableComponentNew";
import { formatCurrency } from "~/utils/formats";
import type { Fichada, Reporte } from "~/types/liquidaciones";
import { Button } from "flowbite-react";
import { FaCopy, FaDownload } from "react-icons/fa6";
const resumenColumns: TableColumn<LiquidacionResumen>[] = [
  {
    id: "empleado",
    name: "Empleado",
    selector: (row) => row.empleado.nombre_completo,
    sortable: true,
    pinned: "left",
    minWidth: "250px",
  },
  {
    id: "horas_trabajadas",
    name: "HS totales",
    selector: (row) => row.horas_trabajadas,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.horas_trabajadas) && row.horas_trabajadas % 1 !== 0;
      return isDecimal
        ? String(row.horas_trabajadas).replace(".", ",")
        : row.horas_trabajadas;
    },
    grow: 0,
    sortable: true,
  },
  {
    id: "horas_feriado",
    name: "HS Feriado",
    selector: (row) => row.horas_feriado,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.horas_feriado) && row.horas_feriado % 1 !== 0;
      return isDecimal
        ? String(row.horas_feriado).replace(".", ",")
        : row.horas_feriado;
    },
    grow: 0,
    sortable: true,
  },
  {
    id: "horas_pagadas",
    name: "HS Pagadas",
    selector: (row) => row.horas_trabajadas + row.horas_feriado,
    format: (row) => {
      const hs_pagada = row.horas_trabajadas + row.horas_feriado;
      const isDecimal = Number.isFinite(hs_pagada) && hs_pagada % 1 !== 0;
      return isDecimal ? String(hs_pagada).replace(".", ",") : hs_pagada;
    },
    grow: 0,
    sortable: true,
  },
  {
    id: "horas_regulares",
    name: "HS Reg",
    selector: (row) =>
      row.horas_trabajadas + row.horas_feriado - row.horas_extras,
    format: (row) => {
      const hs_reg =
        row.horas_trabajadas + row.horas_feriado - row.horas_extras;
      const isDecimal = Number.isFinite(hs_reg) && hs_reg % 1 !== 0;
      return isDecimal ? String(hs_reg).replace(".", ",") : hs_reg;
    },
    grow: 0,
    sortable: true,
    
  },
  {
    id: "horas_extras",
    name: "HS Extras",
    selector: (row) => row.horas_extras,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.horas_extras) && row.horas_extras % 1 !== 0;
      return isDecimal
        ? String(row.horas_extras).replace(".", ",")
        : row.horas_extras;
    },
    grow: 0,
    sortable: true,
  },
  {
    id: "monto_salario_regular",
    name: "Salario",
    selector: (row) => row.monto_salario_regular,
    cell: (row) => <span>{formatCurrency(row.monto_salario_regular)}</span>,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.monto_salario_regular) && row.monto_salario_regular % 1 !== 0;
      return isDecimal
        ? String(row.monto_salario_regular).replace(".", ",")
        : row.monto_salario_regular;
    },
    grow: 0,
    sortable: true,
  },
  {
    id: "monto_salario_extra",
    name: "Extra",
    selector: (row) => row.monto_salario_extra,
    cell: (row) => <span>{formatCurrency(row.monto_salario_extra)}</span>,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.monto_salario_extra) && row.monto_salario_extra % 1 !== 0;
      return isDecimal
        ? String(row.monto_salario_extra).replace(".", ",")
        : row.monto_salario_extra;
    },
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
    id: "salidas_tempranas",
    name: "Sal temp",
    selector: (row) => row.salidas_tempranas,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "premios_perdidos",
    name: "Perdidos",
    selector: (row) => row.premios_perdidos,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "premios_ganados",
    name: "Ganados",
    selector: (row) => row.premios_ganados,
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "premio_recuperado",
    name: "Recuperados",
    selector: (row) => row.premio_recuperado,
    cell: (row) => <span>{formatCurrency(row.premio_recuperado)}</span>,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.premio_recuperado) && row.premio_recuperado % 1 !== 0;
      return isDecimal
        ? String(row.premio_recuperado).replace(".", ",")
        : row.premio_recuperado;
    },
    omit: true,
    grow: 0,
    sortable: true,
  },
  {
    id: "monto_premio",
    name: "Total premios",
    selector: (row) => row.monto_premio,
    cell: (row) => <span>{formatCurrency(row.monto_premio)}</span>,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.monto_premio) && row.monto_premio % 1 !== 0;
      return isDecimal
        ? String(row.monto_premio).replace(".", ",")
        : row.monto_premio;
    },
    grow: 0,
    sortable: true,
  },
  {
    id: "deuda",
    name: "Deuda",
    selector: (row) => row.deuda,
    cell: (row) => <span className={`${row.deuda>0?"text-red-600":""}`}>{formatCurrency(row.deuda)}</span>,
    format: (row) => {
      const isDecimal =
        Number.isFinite(row.deuda) && row.deuda % 1 !== 0;
      return isDecimal
        ? String(row.deuda).replace(".", ",")
        : row.deuda;
    },
    grow: 0,
    sortable: true,
  },
  {
    id: "totalLiquidacion",
    name: "Total",
    selector: (row) =>
      row.monto_salario_regular + row.monto_salario_extra + row.monto_premio,
    cell: (row) => (
      <span className="font-bold">
        {formatCurrency(
          row.monto_salario_regular +
            row.monto_salario_extra +
            row.monto_premio,
        )}
      </span>
    ),
    format: (row) => {
      const total =
        row.monto_salario_regular + row.monto_salario_extra + row.monto_premio;
      const isDecimal = Number.isFinite(total) && total % 1 !== 0;
      return isDecimal ? String(total).replace(".", ",") : total;
    },
    minWidth: "110px",
    pinned: "right",
    grow: 0,
    sortable: true,
  },
];
export default function Resumen({
  liquidacion,
  fichadasGuardadas,
  reportesGuardados,
}: {
  liquidacion?: Liquidacion;
  liquidacionId?: string;
  fichadasGuardadas: Fichada[];
  reportesGuardados: Reporte[];
}) {
  const { premios, isLoading, employees, saldoEmpleados } = useRRHH();
  const pendientesSalida = fichadasGuardadas.filter((f) => !f.salida).length;
  const resumen: LiquidacionResumen[] = useMemo(() => {
    if (!liquidacion || pendientesSalida > 0) return [];
    return calcularResumenLiquidacion({
      liquidacion,
      employees,
      premios,
      fichadas: fichadasGuardadas,
      reportes: reportesGuardados,
      saldoEmpleados,
    });
  }, [
    liquidacion,
    employees,
    premios,
    fichadasGuardadas,
    reportesGuardados,
    pendientesSalida,
  ]);
  const totalesResumen = useMemo(
    () => ({
      monto_salario_regular: resumen.reduce(
        (acc, row) => acc + row.monto_salario_regular,
        0,
      ),
      monto_salario_extra: resumen.reduce(
        (acc, row) => acc + row.monto_salario_extra,
        0,
      ),
      carrocerias: resumen.reduce((acc, row) => acc + row.carrocerias, 0),
      faltas: resumen.reduce((acc, row) => acc + row.faltas, 0),
      tardanzas: resumen.reduce((acc, row) => acc + row.tardanzas, 0),
      salidas_tempranas: resumen.reduce(
        (acc, row) => acc + row.salidas_tempranas,
        0,
      ),
      premios_perdidos: resumen.reduce(
        (acc, row) => acc + row.premios_perdidos,
        0,
      ),
      premios_ganados: resumen.reduce(
        (acc, row) => acc + row.premios_ganados,
        0,
      ),
      premio_recuperado: resumen.reduce(
        (acc, row) => acc + row.premio_recuperado,
        0,
      ),
      monto_premio: resumen.reduce((acc, row) => acc + row.monto_premio, 0),
      total: resumen.reduce(
        (acc, row) =>
          acc +
          row.monto_salario_regular +
          row.monto_salario_extra +
          row.monto_premio,
        0,
      ),
    }),
    [resumen],
  );
  const { download, copy } = useTableExport({
    columns: resumenColumns,
    rows: resumen,
    valueSource: "format",
  });
  if (pendientesSalida > 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50/50 py-12 text-center dark:border-yellow-700 dark:bg-yellow-900/10">
        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
          Faltan completar salidas para generar el resumen
        </p>
        <p className="mt-1 text-sm text-base-500 dark:text-base-400">
          {pendientesSalida} de {fichadasGuardadas.length} fichadas sin hora de
          salida. Completalas en la pestaña{" "}
          <em className="font-medium">Procesar Fichadas</em>.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg shadow-md">
        <TableComponent
          columns={resumenColumns}
          data={resumen}
          backPath=""
          isLoading={isLoading}
          color="yellow"
          labelButton=""
          hasActiveColumn={false}
          searchKeys={["empleado.nombre_completo", "empleado.dni"]}
          searchPlaceholder="Buscar por nombre o DNI"
          scrollHeightOffset={360}
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
              header: "#FFF9D9",
            },
          }}
          showColumnVisibility
          pagination={false}
          message={
            <div className="flex gap-2 items-center">
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                Total: {formatCurrency(totalesResumen.total)}
              </span>
              <Button
                size="sm"
                color={"alternative"}
                onClick={() => copy("csv")}
              >
                <FaCopy className="me-1.5" />
                Copiar
              </Button>
              <Button
                size="sm"
                color={"alternative"}
                onClick={() =>
                  download(
                    `${liquidacion?.desde}/${liquidacion?.hasta}-resumen.csv`,
                  )
                }
              >
                <FaDownload className="me-1.5" />
                Descargar
              </Button>
            </div>
          }
          pointerOnHover={false}
        />
      </div>
      {resumen.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-base-300 py-12 text-center dark:border-base-600">
          <p className="text-sm text-base-500 dark:text-base-400">
            No hay empleados activos para mostrar en el resumen
          </p>
        </div>
      )}
    </div>
  );
}
