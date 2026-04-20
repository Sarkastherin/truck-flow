import type { Route } from "../+types/home";
import { TableComponent } from "~/components/TableComponent";
import type { TableColumn } from "react-data-table-component";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { statusOptionsPedidos } from "~/types/pedido";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoadingComponent } from "~/components/LoadingComponent";
import { BadgeStatusPedido } from "~/components/specials/Badges";
import { useAdministracion } from "~/context/AdministracionContext";
import type { ChequeConSociosYMovimiento } from "~/types/cuentas-corrientes";
import { capitalize } from "~/utils/functions";
import { BadgeStatusCheque } from "~/components/specials/Badges";
import { statusOptionsCheques } from "~/types/cuentas-corrientes";
import { SubTitles } from "~/components/SubTitles";
import { HiOutlineBanknotes } from "react-icons/hi2";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cheques" },
    { name: "description", content: "Bienvenido a la gestión de cheques" },
  ];
}


export default function PedidosHome() {
  const { getAdministracionData, cheques, bancos } = useAdministracion();
  const navigate = useNavigate();
  useEffect(() => {
    if (!cheques) {
      getAdministracionData();
    }
  }, [getAdministracionData, cheques]);
  const handleRowClick = (row: ChequeConSociosYMovimiento) => {
    navigate(`/administracion/cheques/${row.id}`, { state: { pedido: row } });
  };
  if (!cheques) {
    return <LoadingComponent />;
  }
  const columns: TableColumn<ChequeConSociosYMovimiento>[] = [
  {
    name: "Fecha de pago",
    selector: (row) => formatDateUStoES(row.fecha_cobro),
    sortable: true,
    width: "150px",
    sortFunction: (rowA, rowB) => {
      const dateA = new Date(rowA.fecha_cobro);
      const dateB = new Date(rowB.fecha_cobro);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    name: "Tipo de Cheque",
    selector: (row) => capitalize(row.tipo),
    width: "130px",
  },
  {
    name: "Banco",
    selector: (row) => bancos?.find((banco) => banco.value === row.banco)?.label || "-",
    sortable: true,
    width: "150px",
  },
  {
    name: "Número",
    selector: (row) => row.numero || "-",
    sortable: true,
    width: "100px",
  },
  {
    name: "Importe",
    selector: (row) =>
      row.importe.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    sortable: true,
    width: "150px",
  },
  {
    name: "Origen",
    selector: (row) => row.cliente?.razon_social || "-",
    sortable: true,
  },
  {
    name: "Destino",
    selector: (row) => row.proveedor?.razon_social || "-",
    sortable: true,
  },
  {
    name: "Estado",
    cell: (row) => <BadgeStatusCheque status={row.status} />,
    width: "120px",
    sortable: true,
  },
];
  return (
    <>
      <SubTitles title="Cheques" back_path="/administracion" icon={{ component: HiOutlineBanknotes, color: "text-green-500" }} />
      <TableComponent
        columns={columns}
        data={cheques || []}
        filterFields={[
          {
            key: "cliente.razon_social",
            label: "Origen (Cliente)",
          },
          {
            key: "numero",
            label: "Número de Cheque",
          },
          {
            key: "tipo",
            label: "Tipo de Cheque",
            type: "select",
            options: [
              { value: "", label: "Todos" },
              { value: "fisico", label: "Físico" },
              { value: "echeq", label: "Echeq" },
            ],
          },
          {
            key: "proveedor.razon_social",
            label: "Destino (Proveedor)",
          },
          {
            key: "status",
            label: "Estado",
            type: "select",
            options: statusOptionsCheques,
          },
        ]}
        onRowClick={(row) => handleRowClick(row)}
        scrollHeightOffset={330}
      />
    </>
  );
}
