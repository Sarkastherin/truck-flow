import type { Route } from "../+types/home";
import TableComponent  from "~/components/TableComponentNew";
import type { TableColumn } from "react-data-table-component";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { SubTitles } from "~/components/SubTitles";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import {
  statusOptionsCarroceriaUsada,
  type CarroceriaUsadaData,
} from "~/types/carroceria-usada";
import { LoadingComponent } from "~/components/LoadingComponent";
import { BadgeStatusCarroceriaUsada } from "~/components/specials/Badges";
import { FaTrailer } from "react-icons/fa6";
import { formatCurrency } from "~/utils/formats";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Carrocerías Usadas" },
    {
      name: "description",
      content: "Bienvenido a la gestión de carrocerías usadas",
    },
  ];
}

const columns: TableColumn<CarroceriaUsadaData>[] = [
  {
    name: "Numero",
    selector: (row) => row.numero_carroceria || "",
    sortable: true,
    width: "130px",
    filterable: true, 
  },
  {
    name: "Propietario anterior",
    selector: (row) => row.duenno?.razon_social || "",
    sortable: true,
    filterable: true, 
  },
  {
    name: "Modelo",
    selector: (row) => row.tipo_carrozado || "",
    sortable: true,
    filterable: true, 
    filterType: "set"
  },
  {
    name: "Marca",
    selector: (row) => row.marca_carroceria || "",
    sortable: true,
    width: "170px",
    filterable: true, 
    filterType: "set"
  },
  {
    name: "Año",
    selector: (row) => row.anno_fabricacion || "",
    sortable: true,
    width: "120px",
    filterable: true, 
    filterType: "number"
  },

  {
    name: "Precio lista",
    selector: (row) => row.precio_lista || 0,
    format: (row) => formatCurrency(row.precio_lista || 0),
    width: "180px",
    sortable: true,
    filterable: true, 
    filterType: "number"
  },
  {
    name: "Status",
    cell: (row) => <BadgeStatusCarroceriaUsada status={row.status} />,
    sortable: true,
    width: "120px",
    filterable: true, 
    filterType: "set"
  },
];
export default function CarroceriasUsadasHome() {
  const { getCarroceriasUsadasData, carroceriasUsadas, isLoading } =
    useCarroceriasUsadas();
  const navigate = useNavigate();
  useEffect(() => {
    if (!carroceriasUsadas) {
      getCarroceriasUsadasData();
    }
  }, [getCarroceriasUsadasData, carroceriasUsadas]);
  const handleRowClick = (row: CarroceriaUsadaData) => {
    navigate(`/carrocerias-usadas/${row.id}`);
  };
  if (!carroceriasUsadas) {
    return <LoadingComponent />;
  }
  return (
    <>
      <TableComponent
        columns={columns}
        data={carroceriasUsadas || []}
        searchKeys={["tipo_carrozado","color", "status" ]}
        onRowClicked={(row) => handleRowClick(row)}
        onAddRecord={() => navigate("/carrocerias-usadas/nueva")}
        color= "teal"
        scrollHeightOffset={370}
        isLoading={isLoading}
        labelButton="Agregar Carrocería usada"
        title="Inventario de Carrocerías Usadas"
        searchPlaceholder="Buscar por tipo, color o status"
        hasActiveColumn={false}
        backPath="/"
      />
    </>
  );
}
