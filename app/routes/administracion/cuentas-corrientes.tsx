import type { Route } from "../+types/home";
import TableComponent from "~/components/TableComponentNew";
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
import { useLocation } from "react-router";
import { formatCurrency } from "~/utils/formats";
import { formatCuit } from "~/components/InputsForm";
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
    filterable: true,
  },
  {
    name: "CUIT/CUIL",
    selector: (row) => row.cliente?.cuit_cuil || "",
    format: (row) => formatCuit(row.cliente.cuit_cuil),
    sortable: true,
    width: "150px",
    filterable: true,
  },
  {
    name: "Debe",
    selector: (row) => row.debe,
    format: (row) => formatCurrency(row.debe),
    width: "150px",
    sortable: true,
    filterable: true,
    filterType: "number",
  },
  {
    name: "Haber",
    selector: (row) => row.haber,
    format: (row) => formatCurrency(row.haber),
    width: "150px",
    sortable: true,
    filterable: true,
    filterType: "number",
  },
  {
    name: "Saldo",
    selector: (row) => row.debe - row.haber,
    format: (row) => formatCurrency(row.debe - row.haber),
    width: "180px",
    sortable: true,
    filterable: true,
    filterType: "number",
  },
];
export default function CtasCtesHome() {
  const location = useLocation();
  const { openModal } = useModal();
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
      btnNewClient: true,
    });
  };
  const handleSelectSocio = (item: SocioComercial) => {
    openModal("loading", { props: { title: "Cargando cuenta corriente..." } });
    navigate(`/administracion/cuentas-corrientes/${item.id}`);
  };
  if (!ctasCorrientesData) {
    return <LoadingComponent />;
  }
  useEffect(() => {
    if (location.search.includes("openNuevoMovimiento=true")) {
      handleOpenModal();
    }
  }, [location.search]);
  return (
    <>
      <TableComponent
        columns={columns}
        data={ctasCorrientesData || []}
        onAddRecord={handleOpenModal}
        isLoading={false}
        labelButton="Agregar movimientos"
        title={"Cuentas Corrientes - Clientes"}
        backPath="/administracion"
        color={"orange"}
        scrollHeightOffset={270}
        hasActiveColumn={false}
        searchKeys={["cliente.razon_social", "cliente.cuit_cuil"]}
        searchPlaceholder="Buscar por razón social o CUIT"
        onRowClicked={handleRowClick}
      />
    </>
  );
}
