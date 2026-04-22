import { useState } from "react";
import type { Route } from "../+types/home";
import { TableComponent } from "~/components/TableComponent";
import type { TableColumn } from "react-data-table-component";
import { LoadingComponent } from "~/components/LoadingComponent";
import type { SocioComercial } from "~/types/socios";
import { formatCuit } from "~/components/InputsForm";
import { Sidebar } from "~/components/Sidebar";
import { Button } from "flowbite-react";
import { FaPlus } from "react-icons/fa";
import { LuUsers, LuBuilding2 } from "react-icons/lu";
import { useSociosComercial } from "~/context/SociosComercialesContext";
import { useModal } from "~/context/ModalContext";
import { useSocio } from "~/hooks/useSocio";
import { SocioModal } from "~/components/modals/customs/SocioModal";
import { SubTitles } from "~/components/SubTitles";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Socios Comerciales" },
    { name: "description", content: "Gestión de clientes y proveedores" },
  ];
}

type TabsTypes = "clientes" | "proveedores";

const submenu = [
  {
    key: "clientes" as TabsTypes,
    name: "Clientes",
    icon: LuUsers,
  },
  {
    key: "proveedores" as TabsTypes,
    name: "Proveedores",
    icon: LuBuilding2,
  },
];

const columns: TableColumn<SocioComercial>[] = [
  {
    name: "Razón Social",
    selector: (row) => row.razon_social,
    sortable: true,
  },
  {
    name: "CUIT/CUIL",
    selector: (row) => formatCuit(row.cuit_cuil || ""),
    sortable: true,
    width: "130px",
  },
  {
    name: "Provincia",
    selector: (row) => row.provincia,
    sortable: true,
    width: "150px",
  },
  {
    name: "Localidad",
    selector: (row) => row.localidad,
    sortable: true,
    width: "150px",
  },

  {
    name: "Status",
    selector: (row) => row.active,
    sortable: true,
    width: "95px",
  },
];

const filterFields = [
  { key: "razon_social", label: "Razón Social" },
  { key: "cuit_cuil", label: "CUIT/CUIL" },
  { key: "provincia", label: "Provincia" },
  { key: "localidad", label: "Localidad" },
];

export default function SociosComerciales() {
  const { socios } = useSociosComercial();
  const { openModal } = useModal();
  const { form, onCreate, onUpdate, onDelete, onReactivate } = useSocio({
    tipoSocio: "cliente",
    handleCreateSocio: async (data: Parameters<typeof onCreate>[0]) => {
      const newSocio = await onCreate(data);
    },
  });

  const [activeTab, setActiveTab] = useState<TabsTypes>("clientes");

  const isClientes = activeTab === "clientes";
  const tipoActivo: SocioComercial["tipo"] = isClientes
    ? "cliente"
    : "proveedor";
  const singularName = isClientes ? "cliente" : "proveedor";
  const pluralName = isClientes ? "clientes" : "proveedores";

  const filteredSocios = socios.filter((s) => s.tipo === tipoActivo);

  if (!socios) {
    return <LoadingComponent />;
  }

  const handleOpenNuevo = () => {
    form.reset({
      razon_social: "",
      cuit_cuil: "",
      direccion: "",
      telefono_contacto: "",
      email_contacto: "",
      nombre_contacto: "",
      tipo: tipoActivo,
      provincia_id: "",
      provincia: "",
      localidad_id: "",
      localidad: "",
      condicion_iva: "",
      vendedor_id: "",
    });
    form.clearErrors();
    openModal("form", {
      component: SocioModal,
      props: {
        form,
        title: `Nuevo ${singularName}`,
        size: "2xl",
        tipoSocio: tipoActivo,
      },
      onSubmit: form.handleSubmit(onCreate),
    });
  };
  const handleRowClicked = (socio: SocioComercial) => {
    const newForm = form;
    newForm.reset(socio);
    openModal("form", {
      component: SocioModal,
      props: {
        form: newForm,
        title: `Editar: ${socio.razon_social}`,
        onDelete: () => onDelete(socio.id),
        onReactivate: () => onReactivate(socio.id),
        size: "2xl",
        tipoSocio: tipoActivo,
      },
      onSubmit: form.handleSubmit(onUpdate),
    });
  };

  return (
    <div
      className="container mx-auto flex h-full pb-4"
      style={{ minHeight: "calc(100vh - 100px)" }}
    >
      <Sidebar
        aria-label="Menu de socios comerciales"
        submenu={submenu}
        activeTab={activeTab}
        setActiveTab={setActiveTab as (tab: string) => void}
        collapsible
      />
      <div className="relative flex-1 min-w-0 p-6 pt-0 pb-0">
        <div className="flex justify-between items-center mb-4">
          <SubTitles
            title={`Gestión de ${pluralName}`}
            back_path="/configuraciones"
            icon={{ component: LuUsers, color: "text-blue-500" }}
          />
          <Button size="sm" color="violet" onClick={handleOpenNuevo}>
            <FaPlus className="mr-2" />
            Nuevo {singularName}
          </Button>
        </div>
        <TableComponent
          columns={columns}
          data={filteredSocios}
          filterFields={filterFields}
          scrollHeightOffset={405}
          inactiveField="active"
          onRowClick={handleRowClicked}
          emptyState={{
            title: `No hay ${pluralName} cargados`,
            description: `Puedes crear el primer ${singularName} para comenzar.`,
            actionLabel: `Crear ${singularName}`,
            onAction: handleOpenNuevo,
          }}
        />
      </div>
    </div>
  );
}
