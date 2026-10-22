import type { Route } from "../+types/home";
import TableComponent from "~/components/TableComponentNew";
import { useRRHH } from "~/context/RRHHContext";
import { useEffect } from "react";
import type { TableColumn } from "react-data-table-component";
import type { Employee } from "~/types/rrhh";
import { BadgeContrato } from "~/components/specials/Badges";
import { useModal } from "~/context/ModalContext";
import EmployeeModal from "~/components/modals/customs/EmployeeModal";
import { useEmployee } from "~/hooks/useEmployee";
import { formatCurrency } from "~/utils/formats";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nómina" },
    { name: "description", content: "Nómina de empleados" },
  ];
}
const columns: TableColumn<Employee>[] = [
  {
    id: "nombre",
    name: "Nombre completo",
    selector: (row) => row.nombre_completo,
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    id: "dni",
    name: "DNI",
    selector: (row) => row.dni,
    sortable: true,
    width: "100px",
  },
  {
    id: "tipo_contrato",
    name: "Tipo de Contrato",
    cell: (row) => <BadgeContrato tipoPago={row.tipo_pago} />,
    selector: (row) => row.tipo_pago,
    sortable: true,
    width: "180px",
    filterable: true,
    filterType: "set",
  },
  {
    id: "valor_salario",
    name: "Valor Salario",
    selector: (row) => row.valor_salario_semanal || "0",
    format: (row) => formatCurrency(row.valor_salario_semanal || 0),
    sortable: true,
    width: "150px",
  },
  {
    id: "valor_hora_extra",
    name: "Valor Hora Extra",
    selector: (row) => row.valor_hora_extra || 0,
    format: (row) => formatCurrency(row.valor_hora_extra || 0),
    sortable: true,
    width: "150px",
  },
];
export default function Employees() {
  const { form, onCreate, onUpdate, onDelete, onReactivate } = useEmployee();
  const { openModal } = useModal();
  const { getSueldosData, employees, isLoading, isReady } = useRRHH();
  useEffect(() => {
    if (employees.length === 0 && !isReady) getSueldosData();
  }, [isReady, employees, getSueldosData]);
  /* Agregar nuevo empleado */
  const handleOpenModal = (row?: Employee) => {
    const defaultValues = row
      ? row
      : {
          nombre_completo: "",
          dni: "",
          valor_salario_semanal: null,
          valor_hora_extra: null,
          fecha_nacimiento: null,
          telefono: null,
          direccion: null,
          area: undefined,
          seguro: null,
          tiene_carnet: false,
          vehiculo: "no_aplica",
          alergias: false,
          tipo_alergia: "No aplica",
          contacto_emergencia: null,
          siniestros: null,
          talle_camisa: null,
          talle_pantalon: null,
          talle_borcegos: null,
          talle_remera: null,
        };
    form.reset(defaultValues);
    form.clearErrors();
    openModal("form", {
      component: EmployeeModal,
      props: {
        title: `${row ? row.nombre_completo : "Nuevo empleado"}`,
        form,
        size: "2xl",
        onDelete: row && row.active ? () => onDelete(row.id) : undefined,
        onReactivate:
          row && !row.active ? () => onReactivate(row.id) : undefined,
      },
      onSubmit: row ? form.handleSubmit(onUpdate) : form.handleSubmit(onCreate),
    });
  };
  const handleAddEmployee = () => {
    handleOpenModal();
  };
  const handleRowClick = (row: Employee) => {
    handleOpenModal(row);
  };
  return (
    <>
      <TableComponent
        columns={columns}
        data={employees}
        searchKeys={["nombre_completo", "dni"]}
        onRowClicked={handleRowClick}
        onAddRecord={handleAddEmployee}
        isLoading={isLoading}
        labelButton="Agregar empleado"
        title={"Nómina de empleados"}
        backPath="/rrhh"
        color={"blue"}
        scrollHeightOffset={270}
        searchPlaceholder="Buscar por nombre o DNI"
        showColumnVisibility
      />
    </>
  );
}
