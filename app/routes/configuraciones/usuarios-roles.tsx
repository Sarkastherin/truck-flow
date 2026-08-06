import type { Route } from "../+types/home";
import { TableComponent } from "~/components/TableComponent";
import type { TableColumn } from "react-data-table-component";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { statusOptionsPedidos } from "~/types/pedido";
import type { Pedido } from "~/types/pedido";
import { usePedido } from "~/context/PedidoContext";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoadingComponent } from "~/components/LoadingComponent";
import { BadgeStatusPedido } from "~/components/specials/Badges";
import { SubTitles } from "~/components/SubTitles";
import { LuUserRoundCog } from "react-icons/lu";
import { Badge } from "flowbite-react";
import { capitalize } from "~/utils/functions";
import type { Role, UsersTable } from "~/types/users";
import { useUser } from "~/context/UserContext";
import { useUsuario } from "~/hooks/useUsuario";
import { UsuarioModal } from "~/components/modals/customs/UsuarioModal";
import { useModal } from "~/context/ModalContext";
import {optionsRoles} from "~/types/users";
import {BadgeStatusUsuarioRole} from "~/components/specials/Badges";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Usuarios y Roles" },
    {
      name: "description",
      content: "Bienvenido a la gestión de usuarios y roles",
    },
  ];
}

const columns: TableColumn<UsersTable>[] = [
  {
    name: "Nombre",
    selector: (row) => row.nombre,
    sortable: true,
  },
  {
    name: "Apellido",
    selector: (row) => row.apellido,
    sortable: true,
  },
  {
    name: "Email",
    selector: (row) => row.email,
    sortable: true,
    width: "200px",
  },
  {
    name: "Rol",
    cell: (row) => <BadgeStatusUsuarioRole role={row.role} />,
    width: "150px",
    sortable: true,
  },
  {
    name: "Estado",
    selector: (row) => row.active,
    width: "110px",
  },
];
export default function UsuariosRoles() {
  const { openModal } = useModal();
  const { form, onCreate, onUpdate, onDelete, onReactivate } = useUsuario();
  const { getUsersData, users } = useUser();
  useEffect(() => {
    if (!users) {
      getUsersData();
    }
  }, [getUsersData, users]);
  const handleRowClick = (row: UsersTable) => {
    const newForm = form;
    newForm.reset(row);
    openModal("form", {
      component: UsuarioModal,
      props: {
        form: newForm,
        title: `Editar ${row.nombre} ${row.apellido}`,
        onDelete: row.active ? () => onDelete(row.id) : undefined,
        onReactivate: !row.active ? () => onReactivate(row.id) : undefined,
        size: "2xl",
      },
      onSubmit: form.handleSubmit(onUpdate),
    });
  };
  if (!users) {
    return <LoadingComponent />;
  }
  const handleNewUser = () => {
    form.reset({
      nombre: "",
      apellido: "",
      email: "",
      role: "user" as Role,
    });
    form.clearErrors();
    openModal("form", {
      component: UsuarioModal,
      props: {
        form,
        title: "Nuevo Usuario",
        size: "2xl",
      },
      onSubmit: form.handleSubmit(onCreate),
    });
  };
  return (
    <>
      <SubTitles
        title="Usuarios y Roles"
        back_path="/configuraciones"
        icon={{ component: LuUserRoundCog, color: "text-orange-500" }}
      />
      <TableComponent
        columns={columns}
        data={users || []}
        filterFields={[
          {
            key: "nombre",
            label: "Nombre",
          },
          { key: "apellido", label: "Apellido" },
          {
            key: "email",
            label: "Email",
          },
          {
            key: "role",
            label: "Rol",
          },
        ]}
        onRowClick={(row) => handleRowClick(row)}
        btnOnClick={{
          color: "orange",
          title: "Nuevo Usuario",
          onClick: () => handleNewUser(),
        }}
        scrollHeightOffset={370}
      />
    </>
  );
}
