import type { Route } from "../+types/home";
import type {
  Fichada,
  FichadaFile,
  FichadaFileAgrupada,
  FichadaFormValues,
} from "~/types/fichadas";
import { agruparFichadasPorDia, diffHoras } from "~/utils/agruparFichadas";
import TableComponent from "~/components/TableComponentNew";
import type {
  TableColumn,
  ConditionalStyles,
} from "react-data-table-component";
import { useEffect, useState } from "react";
import { useRRHH } from "~/context/RRHHContext";
import type { Employee } from "~/types/rrhh";
import { Alert, Button } from "flowbite-react";
import { FaRegIdCard, FaClock } from "react-icons/fa";
import { useModal } from "~/context/ModalContext";
import Import from "~/components/liquidacion/import";
import { useImportFichadas } from "~/hooks/useImportFichadas";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nueva Liquidación" },
    { name: "description", content: "Nueva Liquidación" },
  ];
}
export type FichadasFileUI = FichadaFileAgrupada & {
  empleado: Employee | undefined;
};
const getColumns = (
  handleCellEdit: (
    row: FichadasFileUI,
    value: string,
    column: TableColumn<FichadasFileUI>,
  ) => void,
): TableColumn<FichadasFileUI>[] => {
  return [
    {
      name: "Fecha",
      selector: (row) =>
        row.fecha.toLocaleDateString("es-AR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      width: "120px",
      filterable: true,
      filterType: "date",
      sortable: true,
    },
    {
      name: "Empleado",
      selector: (row) => row.empleado?.nombre_completo || "No encontrado",
      filterable: true,
      sortable: true,
    },
    {
      name: "DNI ",
      selector: (row) => {
        const dniString = String(row.dniEmpleado);
        const first = dniString.slice(0, 2);
        const second = dniString.slice(2, 5);
        const thrith = dniString.slice(5, 8);
        return `${first}.${second}.${thrith}`;
      },
      width: "120px",
      filterable: true,
      sortable: true,
    },
    {
      name: "Entrada",
      selector: (row) => row.entrada,
      width: "90px",
      editable: true,
      onCellEdit: handleCellEdit,
    },
    {
      name: "Salida",
      selector: (row) => row.salida,
      width: "90px",
      editable: true,
      onCellEdit: handleCellEdit,
      sortable: true,
    },
    {
      name: "Total HS",
      selector: (row) => row.totalHorasTrabajadas,
      width: "110px",
      filterable: true,
      filterType: "number",
      sortable: true,
    },
    {
      name: "HS Reg.",
      selector: (row) => row.horasRegular,
      width: "110px",
    },
    {
      name: "HS Extras",
      selector: (row) => row.horasExtras,
      width: "110px",
    },
  ];
};
export type StepsType = "import" | "load";
export default function NewLiquidacion() {
  const { getSueldosData, employees, isReady } = useRRHH();
  const [step, setStep] = useState<StepsType>("import");
  const { openModal } = useModal();
  const { CUDFichadas } = useRRHH();
  const [fichadasFile, setFichadasFile] = useState<FichadasFileUI[]>([]);
  const [isLoadingImport, setIsLoadingImport] = useState<boolean>(false);

  const handleCellEdit = (
    row: FichadasFileUI,
    value: string,
    column: TableColumn<FichadasFileUI>,
  ) => {
    const field = column.id as number;
    setFichadasFile((prev) =>
      prev.map((rowFichada) => {
        const key = Object.keys(rowFichada)[field - 1];
        const entrada = new Date(
          row.fecha.getFullYear(),
          row.fecha.getMonth() + 1,
          row.fecha.getDate(),
          key === "entrada"
            ? Number(value.split(":")[0])
            : Number(row.entrada.split(":")[0]),
          key === "entrada"
            ? Number(value.split(":")[1])
            : Number(row.entrada.split(":")[1]),
        );
        const salida =
          row.salida || key === "salida"
            ? new Date(
                row.fecha.getFullYear(),
                row.fecha.getMonth() + 1,
                row.fecha.getDate(),
                key === "salida"
                  ? Number(value.split(":")[0])
                  : Number(row.salida?.split(":")[0]),
                key === "salida"
                  ? Number(value.split(":")[1])
                  : Number(row.salida?.split(":")[1]),
              )
            : null;
        const totalHorasTrabajadas = salida ? diffHoras(entrada, salida) : 0;
        const horasRegular =
          totalHorasTrabajadas === 0
            ? 0
            : totalHorasTrabajadas >= 9.5
              ? 9.5
              : totalHorasTrabajadas;
        const horasExtras = Number(
          (totalHorasTrabajadas - horasRegular).toFixed(2),
        );
        return rowFichada.dniEmpleado === row.dniEmpleado &&
          rowFichada.fecha === row.fecha
          ? {
              ...rowFichada,
              [key]: value,
              totalHorasTrabajadas,
              horasRegular,
              horasExtras,
            }
          : rowFichada;
      }),
    );
  };
  const handleSaveFichada = async () => {
    const payload: FichadaFormValues[] = fichadasFile.map((fich) => {
      const row = {
        fecha: new Date(fich.fecha).toISOString().split("T")[0],
        empleado_id: fich.empleado?.id as string,
        entrada: fich.entrada,
        salida: fich.salida,
        total_horas: fich.totalHorasTrabajadas,
        horas_regular: fich.horasRegular,
        horas_extras: fich.horasExtras,
        active: true,
      };
      return row;
    });
    if (!payload) return;
    openModal("loading", {
      props: {
        title: "Cargando fichadas",
      },
    });
    try {
      const result = await CUDFichadas(payload as Fichada[], []);
      if (!result.success) {
        throw new Error(result.message || "No se pudo cargar las fichadas");
      }
      openModal("success", {
        message: result.message || "Fichada guardada",
      });
    } catch (error) {
      openModal("error", {
        message:
          error ||
          "Hubo un error al guardar las fichadas. Por favor, inténtalo de nuevo.",
      });
    }
  };
  const columns = getColumns(handleCellEdit);
  const hasNoEncontrados = fichadasFile?.some((fich) => !fich.empleado);
  const tieneSalida = fichadasFile?.some((fich) => !fich.salida);
  const conditionalRowStyles: ConditionalStyles<FichadasFileUI>[] = [
    {
      when: (row) => !row.salida,
      classNames: [
        "border-l-4",
        "border-red-500",
        "!bg-red-300/20",
        "!text-red-500",
      ],
    },
  ];

  return (
    <>
      {step === "import" && (
        <Import
          setFichadasFile={setFichadasFile}
          setIsLoadingImport={setIsLoadingImport}
          setStep={setStep}
        />
      )}
      {step === "load" && (
        <>
          {fichadasFile && hasNoEncontrados && (
            <Alert
              className="mb-6"
              color="red"
              withBorderAccent
              icon={FaRegIdCard}
            >
              <span>
                <span className="font-bold">DNI no encontrado</span> Hay algunos
                DNI's en el archivo de fichadas que no están registrados en el
                listado de <em className="font-medium">Empleados</em>. Agregalos
                en <em className="font-medium">Empleados</em> o corrijelos{" "}
                <em className="font-medium">el archivo de fichadas</em>
              </span>
            </Alert>
          )}
          {fichadasFile && tieneSalida && (
            <Alert
              className="mb-6"
              color="yellow"
              withBorderAccent
              icon={FaClock}
            >
              <span>
                <span className="font-bold">Faltan completar salidas</span> Hay
                algunos registros en el archivo de fichadas que no tienen la{" "}
                <em className="font-medium">hora de salida</em>, por favor
                completalos en esta <em className="font-medium">Tabla</em>.
              </span>
            </Alert>
          )}
          <TableComponent
            columns={columns}
            data={fichadasFile}
            title={"Fichadas"}
            backPath="/rrhh"
            isLoading={isLoadingImport}
            //noDataComponent={<NoDataComponent />}
            color="yellow"
            labelButton=""
            hasActiveColumn={false}
            scrollHeightOffset={370}
            searchKeys={["empleado.nombre_completo", "empleado.dni"]}
            searchPlaceholder="Buscar por nombre o DNI"
            pointerOnHover={false}
            highlightOnHover={false}
            cellNavigation
            conditionalRowStyles={conditionalRowStyles}
          />
        </>
      )}

      {!isLoadingImport && (
        <div className="absolute bottom-10 left-0 w-full">
          <div className=" px-10 flex justify-between">
            <Button
              color="dark"
              onClick={() => {
                setFichadasFile([]);
                setIsLoadingImport(false);
              }}
            >
              Volver a cargar archivo
            </Button>
            <Button color="yellow" onClick={handleSaveFichada} disabled={tieneSalida || hasNoEncontrados}>Guardar, y continuar</Button>
          </div>
        </div>
      )}
    </>
  );
}
