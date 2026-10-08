import type { Route } from "../+types/home";
import TableComponent from "~/components/TableComponentNew";
import { useRRHH } from "~/context/RRHHContext";
import { useEffect } from "react";
import type { TableColumn } from "react-data-table-component";
import type { Premios } from "~/types/rrhh";
import { useModal } from "~/context/ModalContext";
import PremiosModal from "~/components/modals/customs/PremiosModal";
import { usePremios } from "~/hooks/usePremios";
import { BadgePremiosSector } from "~/components/specials/Badges";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Premios" },
    { name: "description", content: "Premios de empleados" },
  ];
}
const columns: TableColumn<Premios>[] = [
  {
    name: "Nombre",
    selector: (row) => row.nombre,
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    name: "Valor",
    selector: (row) =>
      row.precio.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    sortable: true,
    width: "150px",
  },
  {
    name: "Sector",
    cell: (row) => <BadgePremiosSector sector={row.sector || "no_definido"} />,
    selector: (row) => row.sector,
    sortable: true,
    width: "180px",
    filterable: true,
    filterType: "set",
  },
  {
    name: "Tipo",
    selector: (row) => row.tipo,
    sortable: true,
    width: "180px",
    filterable: true,
    filterType: "set",
  },
];
export default function Employees() {
  const { form, onCreate, onUpdate, onDelete, onReactivate } = usePremios();
  const { openModal } = useModal();
  const { getSueldosData, premios, isLoading, isReady } = useRRHH();
  useEffect(() => {
    if (premios.length === 0 && !isReady) getSueldosData();
  }, [isReady, premios, getSueldosData]);
  /* Agregar nuevo empleado */
  const handleOpenModal = (row?: Premios) => {
    const defaultValues = row
      ? row
      : {
          nombre: "",
          precio: 0,
          sector: "",
          tipo: "",
        };
    form.reset(defaultValues as Premios);
    form.clearErrors();
    openModal("form", {
      component: PremiosModal,
      props: {
        title: `${row ? row.nombre : "Nuevo empleado"}`,
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
  const handleRowClick = (row: Premios) => {
    handleOpenModal(row);
  };
  return (
    <>
      <TableComponent
        columns={columns}
        data={premios}
        searchKeys={["nombre"]}
        onRowClicked={(row) => handleRowClick(row)}
        onAddRecord={handleAddEmployee}
        isLoading={isLoading}
        labelButton="Agregar premio"
        title={"Premios de empleados"}
        backPath="/rrhh"
        color={"pink"}
        scrollHeightOffset={270}
        searchPlaceholder="Buscar por nombre"
      />
    </>
  );
}
