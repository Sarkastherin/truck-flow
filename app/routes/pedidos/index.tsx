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
import { LuBookMarked } from "react-icons/lu";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pedidos" },
    { name: "description", content: "Bienvenido a la gestión de pedidos" },
  ];
}

const columns: TableColumn<Pedido>[] = [
  {
    name: "Número",
    selector: (row) => row.numero_pedido,
    width: "100px",
    sortable: true,
  },
  {
    name: "Cliente",
    selector: (row) => row.cliente?.razon_social || "",
    sortable: true,
    width: "200px",
  },
  {
    name: "F. prevista",
    selector: (row) => formatDateUStoES(row.fecha_estimada_entrega),
    width: "120px",
    sortable: true,
    sortFunction: (rowA, rowB) => {
      if (!rowA.fecha_estimada_entrega) return 1;
      if (!rowB.fecha_estimada_entrega) return -1;
      const dateA = new Date(rowA.fecha_estimada_entrega);
      const dateB = new Date(rowB.fecha_estimada_entrega);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    name: "F. pedido",
    selector: (row) => formatDateUStoES(row.fecha_pedido),
    width: "120px",
    sortable: true,
    sortFunction: (rowA, rowB) => {
      const dateA = new Date(rowA.fecha_pedido);
      const dateB = new Date(rowB.fecha_pedido);
      return dateA.getTime() - dateB.getTime();
    },
  },

  {
    name: "Precio Total",
    selector: (row) =>
      row.precio.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    width: "150px",
    sortable: true,
  },
  {
    name: "Armador",
    selector: (row) =>
      row.ordenes_trabajo?.find((wo) => wo.cargo === "armador")
        ?.responsable_nombre || "",
    width: "150px",
    sortable: true,
  },
  {
    name: "Estado",
    cell: (row) => <BadgeStatusPedido status={row.status} />,
    width: "150px",
    sortable: true,
  },
];
export default function PedidosHome() {
  const { getPedidosData, pedidos } = usePedido();
  const navigate = useNavigate();
  useEffect(() => {
    if (!pedidos) {
      getPedidosData();
    }
  }, [getPedidosData, pedidos]);
  const handleRowClick = (row: Pedido) => {
    navigate(`/pedidos/${row.id}`);
  };
  if (!pedidos) {
    return <LoadingComponent />;
  }
  return (
    <>
      <SubTitles title="Pedidos" back_path="/" icon={{ component: LuBookMarked, color: "text-blue-500" }} />
      <TableComponent
        columns={columns}
        data={pedidos || []}
        filterFields={[
          {
            key: "numero_pedido",
            label: "Número de Pedido",
          },
          { key: "cliente.razon_social", label: "Cliente" },
          {
            key: "ordenes_trabajo.armador.responsable_nombre",
            label: "Armador",
          },
          {
            key: "status",
            label: "Estado",
            type: "select",
            options: statusOptionsPedidos,
          },
        ]}
        onRowClick={(row) => handleRowClick(row)}
        btnOnClick={{
          color: "blue",
          title: "Nuevo Pedido",
          onClick: () => navigate("/pedidos/nuevo"),
        }}
        scrollHeightOffset={370}
      />
    </>
  );
}
