import type { Route } from "../+types/home";
import TableComponent from "~/components/TableComponentNew";
import type { TableColumn } from "react-data-table-component";
import { formatDateUStoES, formatCurrency } from "~/utils/formats";
import type { Pedido } from "~/types/pedido";
import { usePedido } from "~/context/PedidoContext";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { BadgeStatusPedido } from "~/components/specials/Badges";
import { Badge } from "flowbite-react";
import { capitalize } from "~/utils/functions";
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
    grow: 0,
    sortable: true,
  },
  {
    name: "Cliente",
    selector: (row) => row.cliente?.razon_social || "",
    sortable: true,
    grow: 2,
    pinned: "left",
    filterable: true,
  },
  {
    name: "Carrozado",
    selector: (row) => row.carroceria?.nombre || "-",
    sortable: true,
    grow: 2,
    filterable: true,
    filterType: "set",
  },
  {
    name: "Tipo",
    selector: (row) => row.tipo,
    cell: (row) => (
      <Badge color={`${row.tipo === "nueva" ? "blue" : "yellow"}`}>
        {capitalize(row.tipo)}
      </Badge>
    ),
    sortable: true,
    width: "110px",
    filterable: true,
    filterType: "set",
  },
  {
    name: "F. prevista",
    selector: (row) => row.fecha_estimada_entrega,
    format: (row) => formatDateUStoES(row.fecha_estimada_entrega),
    width: "130px",
    sortable: true,
    sortFunction: (rowA, rowB) => {
      if (!rowA.fecha_estimada_entrega) return 1;
      if (!rowB.fecha_estimada_entrega) return -1;
      const dateA = new Date(rowA.fecha_estimada_entrega);
      const dateB = new Date(rowB.fecha_estimada_entrega);
      return dateA.getTime() - dateB.getTime();
    },
    filterable: true,
    filterType: "date",
  },
  {
    name: "F. pedido",
    selector: (row) => row.fecha_pedido,
    format: (row) => formatDateUStoES(row.fecha_pedido),
    width: "130px",
    sortable: true,
    sortFunction: (rowA, rowB) => {
      const dateA = new Date(rowA.fecha_pedido);
      const dateB = new Date(rowB.fecha_pedido);
      return dateA.getTime() - dateB.getTime();
    },
    filterable: true,
    filterType: "date",
  },

  {
    name: "Precio Total",
    selector: (row) => formatCurrency(row.precio),
    width: "150px",
    sortable: true,
    filterable: true,
    filterType: "number",
  },
  {
    name: "Armador",
    selector: (row) => row.carroceria?.armador,
    sortable: true,
    width: "150px",
    filterable: true,
    filterType: "set",
  },
  {
    name: "Estado",
    selector:row=> row.status,
    cell: (row) => <BadgeStatusPedido status={row.status} />,
    width: "150px",
    sortable: true,
    filterable: true,
    filterType: "set",
  },
];
export default function PedidosHome() {
  const { getPedidosData, pedidos, isLoading } = usePedido();
  const navigate = useNavigate();
  useEffect(() => {
    if (!pedidos) {
      getPedidosData();
    }
  }, [getPedidosData, pedidos]);
  const handleRowClick = (row: Pedido) => {
    navigate(`/pedidos/${row.id}`);
  };
  return (
    <>
      <TableComponent
        columns={columns}
        data={pedidos || []}
        searchKeys={[
          "cliente.razon_social",
          "carroceria.nombre",
          "carroceria.armador",
          "numero_pedido"
        ]}
        onRowClicked={(row) => handleRowClick(row)}
        onAddRecord={() => navigate("/pedidos/nuevo")}
        isLoading={isLoading}
        labelButton="Agregar pedido"
        title={"Pedidos"}
        backPath="/"
        color={"blue"}
        scrollHeightOffset={270}
        searchPlaceholder="Buscar por cliente, carrozado, armador o numero de pedido"
        hasActiveColumn={false}
      />
    </>
  );
}
