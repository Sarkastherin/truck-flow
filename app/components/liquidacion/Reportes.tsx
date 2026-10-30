import { useMemo, useState } from "react";
import { useRRHH } from "~/context/RRHHContext";
import type {
  Liquidacion,
  Reporte,
  Fichada,
  LiquidacionResumen,
  ReporteFormValues,
} from "~/types/liquidaciones";
import ReportesEmpleadoModal from "~/components/liquidacion/ReportesEmpleadoModal";
import { calcularResumenLiquidacion } from "~/utils/liquidacionCalculos";
import { useModal } from "~/context/ModalContext";
import type { TableColumn } from "react-data-table-component";
import TableComponent from "~/components/TableComponentNew";
import { formatDni, type Employee } from "~/types/rrhh";
import { formatCurrency } from "~/utils/formats";
const produccionColumns: TableColumn<LiquidacionResumen>[] = [
  {
    id: "empleado",
    name: "Empleado",
    selector: (row) => row.empleado.nombre_completo,
    sortable: true,
    filterable: true,
    filterType: "text",
    grow: 1,
  },
  {
    id: "dni",
    name: "DNI",
    selector: (row) => row.empleado.dni,
    format: (row) => formatDni(row.empleado.dni),
    sortable: true,
    filterable: true,
    grow: 0,
  },
  {
    id: "reportes",
    name: "Reportes",
    selector: (row) => row.reportes.length,
    center: true,
    sortable: true,
    filterable: true,
    filterType: "number",
    grow: 0,
  },
  {
    id: "total",
    name: "Total",
    selector: (row) => row.monto_premio,
    cell: (row) => (
      <span className="font-semibold">{formatCurrency(row.monto_premio)}</span>
    ),
    right: true,
    sortable: true,
    filterType: "number",
    grow: 0,
  },
];
export default function Reportes({
  liquidacion,
  liquidacionId,
  fichadasGuardadas,
  reportesGuardados,
}: {
  liquidacion?: Liquidacion;
  liquidacionId?: string;
  fichadasGuardadas: Fichada[];
  reportesGuardados: Reporte[];
}) {
  const { premios, isLoading, CUDReportes, employees, saldoEmpleados } = useRRHH();

  const [selectedEmpleado, setSelectedEmpleado] = useState<Employee | null>(
    null,
  );
  const [grupoEmpleados, setGrupoEmpleados] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<LiquidacionResumen[]>([]);
  const [isSavingReportes, setIsSavingReportes] = useState(false);
  const { openModal, closeModal } = useModal();
  const resumen: LiquidacionResumen[] = useMemo(() => {
    if (!liquidacion) return [];
    return calcularResumenLiquidacion({
      liquidacion,
      employees,
      premios,
      fichadas: fichadasGuardadas,
      reportes: reportesGuardados,
      saldoEmpleados,
    });
  }, [liquidacion, employees, premios, fichadasGuardadas, reportesGuardados]);
  const handleSelectGroup = () => {
    setSelectedEmpleado(null);
    setGrupoEmpleados(selected.map((row) => row.empleado));
  };
  const totalPremiosGeneral = useMemo(
    () => resumen.reduce((acc, row) => acc + row.monto_premio, 0),
    [resumen],
  );
  const selectedEmpleadoRow = selectedEmpleado
    ? resumen.find((row) => row.empleado.id === selectedEmpleado.id)
    : undefined;
  const handleSaveGrupoReportes = async (reportes: ReporteFormValues[]) => {
    if (!liquidacionId || grupoEmpleados.length === 0) return;

    setIsSavingReportes(true);
    openModal("loading", {
      props: {
        title: "Cargando producción al grupo",
      },
    });
    try {
      const result = await CUDReportes(reportes as Reporte[], []);
      if (!result.success) {
        throw new Error(
          result.error ||
            result.message ||
            "No se pudieron cargar los reportes",
        );
      }
      const cantidadEmpleados = grupoEmpleados.length;
      closeModal();
      setGrupoEmpleados([]);
      setSelected([]);
      openModal("success", {
        props: {
          title: "Producción cargada",
          message: `${reportes.length} reporte${reportes.length === 1 ? "" : "s"} cargado${reportes.length === 1 ? "" : "s"} a ${cantidadEmpleados} empleado${cantidadEmpleados === 1 ? "" : "s"}`,
        },
      });
    } catch (error) {
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Hubo un error al cargar la producción. Inténtalo de nuevo.",
        },
      });
    } finally {
      setIsSavingReportes(false);
    }
  };
  const handleSaveReportes = async (
    reportes: ReporteFormValues[],
    deletedIds: string[],
  ) => {
    if (!liquidacionId || !selectedEmpleado) return;

    setIsSavingReportes(true);
    openModal("loading", {
      props: {
        title: "Guardando reportes",
      },
    });
    try {
      const result = await CUDReportes(reportes as Reporte[], deletedIds);
      if (!result.success) {
        throw new Error(
          result.error ||
            result.message ||
            "No se pudieron guardar los reportes",
        );
      }
      closeModal();
      setSelectedEmpleado(null);
      openModal("success", {
        props: {
          title: "Reportes guardados",
          message: result.message || "Los reportes se guardaron correctamente",
        },
      });
    } catch (error) {
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Hubo un error al guardar los reportes. Inténtalo de nuevo.",
        },
      });
    } finally {
      setIsSavingReportes(false);
    }
  };
  const handleCloseReportesModal = () => {
    setSelectedEmpleado(null);
    setGrupoEmpleados([]);
  };
  const handleRowClick = (row: LiquidacionResumen) => {
    openModal("form", {});
  };
  return (
    <>
      <TableComponent
        columns={produccionColumns}
        data={resumen}
        backPath=""
        isLoading={isLoading}
        color="yellow"
        labelButton=""
        hasActiveColumn={false}
        storageKey={`liquidacion_${liquidacionId}_reportes`}
        onRowClicked={(row) => {
          setGrupoEmpleados([]);
          setSelectedEmpleado(row.empleado);
        }}
        searchKeys={["empleado.nombre_completo", "empleado.dni"]}
        searchPlaceholder="Buscar por nombre o DNI"
        scrollHeightOffset={360}
        selectableRows
        selectedRows={selected}
        onSelectedRowsChange={({ selectedRows }) => setSelected(selectedRows)}
        customTheme={{
          typography: { fontSize: "12px", fontSizeHeader: "13px" },
          spacing: {
            rowHeight: "34px",
            cellPaddingX: "8px",
          },
          text: {
            primary: "#333333",
          },
        }}
        message={
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button
                className="text-sm border px-1.5 rounded border-primary-500 text-primary-500 font-semibold hover:bg-primary-500 hover:text-white cursor-pointer transition-all font-mono"
                onClick={() =>
                  setSelected(
                    resumen.filter((res) => res.empleado.grupo === "Cacho"),
                  )
                }
              >
                Grupo: Cacho
              </button>
              <button
                className="text-sm border px-1.5 rounded border-base-500 text-base-500 font-semibold hover:bg-base-500 hover:text-white cursor-pointer transition-all font-mono"
                onClick={() => {
                  setSelected([]);
                  setGrupoEmpleados([]);
                }}
                color={"light"}
              >
                Limpiar
              </button>
            </div>
            {selected.length > 0 && (
              <div
                className="mt-2 text-xs underline text-primary-600 dark:text-primary-400 cursor-pointer"
                onClick={handleSelectGroup}
              >
                Cargar premio/producción a los {selected.length} seleccionado
                {selected.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
        }
        pagination={false}
      />
      <ReportesEmpleadoModal
        show={Boolean(selectedEmpleado) || grupoEmpleados.length > 0}
        empleado={selectedEmpleado}
        grupoEmpleados={grupoEmpleados}
        rows={selectedEmpleadoRow?.reportes ?? []}
        premios={premios}
        liquidacionId={liquidacionId ?? ""}
        isSaving={isSavingReportes}
        onSave={
          grupoEmpleados.length > 0
            ? handleSaveGrupoReportes
            : handleSaveReportes
        }
        onClose={handleCloseReportesModal}
      />
    </>
  );
}
