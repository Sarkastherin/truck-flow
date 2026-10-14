import type { Route } from "../+types/home";
import TableComponent from "~/components/TableComponentNew";
import { useRRHH } from "~/context/RRHHContext";
import { useEffect } from "react";
import type {
  ExpanderComponentProps,
  TableColumn,
} from "react-data-table-component";
import type { CtaCteEmpleados, Employee, MvtoEmpleados } from "~/types/rrhh";
import { useModal } from "~/context/ModalContext";
import PremiosModal from "~/components/modals/customs/PremiosModal";
import { useMvtoEmpleado } from "~/hooks/useMvtoEmpleado";
import { BadgePremiosSector } from "~/components/specials/Badges";
import { capitalize } from "~/utils/functions";
import { SeleccionarEmpleadoModal } from "~/components/modals/customs/SeleccionarEmpleadoModal";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import MvtoModal from "~/components/modals/customs/MvtoEmpleadoModal";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Saldos" },
    { name: "description", content: "MvtoEmpleados empleados" },
  ];
}
const getColumns = (
  handleAddMvto: (empleado: Employee) => void,
): TableColumn<CtaCteEmpleados>[] => {
  return [
    {
      name: "Empledo deudor",
      selector: (row) => row.empleado.nombre_completo,
      sortable: true,
      filterable: true,
      filterType: "text",
    },
    {
      name: "Debe",
      selector: (row) =>
        row.debe.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
        }),
      sortable: true,
      width: "150px",
    },
    {
      name: "Haber",
      selector: (row) =>
        row.haber.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
        }),
      sortable: true,
      width: "150px",
    },
    {
      name: "Saldo",
      selector: (row) => {
        const saldo = row.debe - row.haber;
        return saldo.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
        });
      },
      sortable: true,
      width: "150px",
    },
    {
      name: "Acciones",
      width: "95px",
      cell: (row) => (
        <Badge
          className="cursor-pointer"
          color="yellow"
          onClick={() => handleAddMvto(row.empleado)}
        >
          + Mvto
        </Badge>
      ),
    },
  ];
};
export default function MvtoEmpleadosPage() {
  const { form, onCreate, onUpdate, onDelete, onReactivate } =
    useMvtoEmpleado();
  const { openModal, closeModal } = useModal();
  const { getSueldosData, saldoEmpleados, isLoading, isReady } = useRRHH();
  useEffect(() => {
    if (saldoEmpleados.length === 0 && !isReady) getSueldosData();
  }, [isReady, saldoEmpleados, getSueldosData]);
  const handleOpenModal = (empleado: Employee, mvtoData?: MvtoEmpleados) => {
    const defaultvalues = mvtoData
      ? mvtoData
      : {
          empleado_id: empleado.id,
          fecha_movimiento: new Date().toISOString().split("T")[0],
          tipo_movimiento: "deuda",
          debe: 0,
          haber: 0,
        };
    form.reset(defaultvalues as MvtoEmpleados);
    form.clearErrors();
    openModal("form", {
      component: MvtoModal,
      props: {
        title: `${mvtoData ? "Editar movimiento" : "Registrar movimiento"}`,
        form,
        size: "2xl",
        tipoMovimiento: mvtoData ? mvtoData.tipo_movimiento : "deuda",
      },
      onSubmit: mvtoData
        ? form.handleSubmit(onUpdate)
        : form.handleSubmit(onCreate),
    });
  };
  const ExpandedRow = ({
    data: row,
  }: ExpanderComponentProps<CtaCteEmpleados>) => {
    const handleRowClick = (mov: MvtoEmpleados) => {
      handleOpenModal(row.empleado, mov)
    };
    return (
      <Table className="font-mono text-sm">
        <colgroup>
          <col className="w-[15%]" />
          <col className="w-[10%]" />
          <col />
          <col className="w-[10%]" />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableHeadCell>Fecha</TableHeadCell>
            <TableHeadCell>Tipo</TableHeadCell>
            <TableHeadCell>Concepto</TableHeadCell>
            <TableHeadCell>Monto</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {row.movimientos.map((mov) => {
            const monto =
              mov.tipo_movimiento === "deuda" ? mov.debe * -1 : mov.haber;
            const style =
              mov.tipo_movimiento === "deuda"
                ? "text-red-500 dark:text-red-400"
                : "text-green-600 dark:text-green-400";
            return (
              <TableRow
                key={mov.id}
                className="cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950/50"
                onClick={() => handleRowClick(mov)}
              >
                <td className="py-2 px-2">
                  {formatDateUStoES(mov.fecha_movimiento)}
                </td>
                <td className="py-2 px-2">
                  <Badge
                    color={mov.tipo_movimiento === "deuda" ? "red" : "green"}
                  >
                    {capitalize(mov.tipo_movimiento)}
                  </Badge>
                </td>
                <td className="py-2 px-2">{mov.concepto}</td>
                <td className={`py-2 px-2 font-bold  ${style}`}>
                  {monto.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </td>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };
  const handleAddMvto = (empleado: Employee) => {
    form.reset({
      empleado_id: empleado.id,
      fecha_movimiento: new Date().toISOString().split("T")[0],
      tipo_movimiento: "deuda",
      debe: 0,
      haber: 0,
    });
    openModal("form", {
      component: MvtoModal,
      props: {
        title: `Registrar de deuda a: ${empleado.nombre_completo}`,
        form,
        size: "2xl",
        tipoMovimiento: "deuda",
      },
      onSubmit: form.handleSubmit(onCreate),
    });
  };
  const handleSelectEmployee = (empleado: Employee) => {
    handleAddMvto(empleado);
  };
  const handleOpenSearchEmployeeModal = () => {
    openModal("custom", {
      title: `Seleccionar empleado`,
      component: SeleccionarEmpleadoModal,
      onSelect: handleSelectEmployee,
    });
  };
  const columns = getColumns(handleAddMvto);
  return (
    <>
      <TableComponent
        columns={columns}
        data={saldoEmpleados}
        searchKeys={["empleado.nombre_completo"]}
        isLoading={isLoading}
        labelButton="Agregar movimiento"
        title={"Saldos de empleados"}
        backPath="/rrhh"
        color={"green"}
        scrollHeightOffset={270}
        searchPlaceholder="Buscar por nombre"
        hasActiveColumn={false}
        btnAction={{
          onClick: handleOpenSearchEmployeeModal,
          label: "🔎 Buscar empleado",
        }}
        expandableRows
        expandableRowsComponent={ExpandedRow}
        pointerOnHover={false}
        highlightOnHover={false}
      />
    </>
  );
}
