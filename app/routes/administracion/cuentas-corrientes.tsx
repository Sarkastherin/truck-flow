import type { Route } from "../+types/home";
import { TableComponent } from "~/components/TableComponent";
import type { TableColumn } from "react-data-table-component";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoadingComponent } from "~/components/LoadingComponent";
import type { CtaCte } from "~/types/cuentas-corrientes";
import { useAdministracion } from "~/context/AdministracionContext";
import { SubTitles } from "~/components/SubTitles";
import { LuBookUser } from "react-icons/lu";
import { useModal } from "~/context/ModalContext";
import { SeleccionarSocioModal } from "~/components/modals/customs/SeleccionarSocioModal";
import type { SocioComercial } from "~/types/socios";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cuentas Corrientes" },
    {
      name: "description",
      content: "Bienvenido a la gestión de cuentas corrientes",
    },
  ];
}
const columns: TableColumn<CtaCte>[] = [
  {
    name: "Cliente",
    selector: (row) => row.cliente?.razon_social || "",
    sortable: true,
  },
  {
    name: "CUIT/CUIL",
    selector: (row) => row.cliente?.cuit_cuil || "",
    sortable: true,
  },
  {
    name: "Debe",
    selector: (row) =>
      row.debe.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
    width: "150px",
    sortable: true,
  },
  {
    name: "Haber",
    selector: (row) =>
      row.haber.toLocaleString("es-AR", { style: "currency", currency: "ARS" }),
    width: "150px",
    sortable: true,
  },

  {
    name: "Saldo",
    selector: (row) =>
      (row.debe - row.haber).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    width: "180px",
    sortable: true,
  },
];
export default function CtasCtesHome() {
  const { openModal, closeModal } = useModal();
  const { getAdministracionData, ctasCorrientesData } = useAdministracion();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ctasCorrientesData) {
      getAdministracionData();
    }
  }, [getAdministracionData, ctasCorrientesData]);
  const handleRowClick = (row: CtaCte) => {
    navigate(`/administracion/cuentas-corrientes/${row.cliente.id}`);
  };
  const handleOpenModal = () => {
    openModal("custom", {
      title: `Seleccionar cliente`,
      component: SeleccionarSocioModal,
      onSelect: handleSelectSocio,
      tipoSocio: "cliente",
    });
  };
  const handleSelectSocio = (item: SocioComercial) => {
    navigate(`/administracion/cuentas-corrientes/${item.id}`);
    closeModal();
  };
  if (!ctasCorrientesData) {
    return <LoadingComponent />;
  }
  return (
    <>
      <SubTitles
        title="Cuentas Corrientes"
        back_path="/administracion"
        icon={{ component: LuBookUser, color: "text-orange-500" }}
      />
      <TableComponent
        columns={columns}
        data={ctasCorrientesData || []}
        filterFields={[
          { key: "cliente.razon_social", label: "Cliente" },
          {
            key: "cliente.cuit_cuil",
            label: "CUIT/CUIL",
          },
        ]}
        onRowClick={(row) => handleRowClick(row)}
        btnOnClick={{
          color: "orange",
          title: "Agregar movimiento",
          onClick: handleOpenModal,
        }}
        scrollHeightOffset={370}
      />
    </>
  );
}
