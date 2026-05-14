import type { Route } from "../+types/home";
import { TableComponent } from "~/components/TableComponent";
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
  },
  {
    name: "Modelo",
    selector: (row) => row.tipo_carrozado || "",
    sortable: true,
  },
  {
    name: "Color",
    selector: (row) => row.color || "",
    sortable: true,
  },
  {
    name: "Marca",
    selector: (row) => row.marca_carroceria || "",
    sortable: true,
    width: "150px",
  },
  {
    name: "Año",
    selector: (row) => row.anno_fabricacion || "",
    sortable: true,
    width: "150px",
  },

  {
    name: "Precio lista",
    selector: (row) =>
      (row.precio_lista || 0).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      }),
    width: "150px",
    sortable: true,
  },
  {
    name: "Status",
    cell: (row) => <BadgeStatusCarroceriaUsada status={row.status} />,
    sortable: true,
    width: "150px",
  },
];
export default function CarroceriasUsadasHome() {
  const { getCarroceriasUsadasData, carroceriasUsadas } =
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
      <SubTitles
        title="Inventario de Carrocerías Usadas"
        back_path="/"
        icon={{
          component: FaTrailer,
          color: "text-teal-500 dark:text-teal-400",
        }}
      />
      <TableComponent
        columns={columns}
        data={carroceriasUsadas || []}
        filterFields={[
          {
            key: "tipo_carrozado",
            label: "Tipo Carrozado",
          },
          { key: "color", label: "Color" },
          {
            key: "status",
            label: "Estado",
            type: "select",
            options: statusOptionsCarroceriaUsada,
          },
        ]}
        onRowClick={(row) => handleRowClick(row)}
        btnOnClick={{
          color: "teal",
          title: "Agregar Carrocería Usada",
          onClick: () => navigate("/carrocerias-usadas/nueva"),
        }}
        scrollHeightOffset={370}
      />
    </>
  );
}
