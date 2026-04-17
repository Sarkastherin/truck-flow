import { useState } from "react";
import type { Route } from "../+types/home";
import { Sidebar } from "~/components/Sidebar";
import { TableComponent } from "~/components/TableComponent";
import useItemsConfig from "~/hooks/useItemsConfig";
import { FaPlus } from "react-icons/fa";
import { Button, Card } from "flowbite-react";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import logo from "../../../public/camion.png";
import { useNavigate } from "react-router";
import { NavLink } from "react-router";
import {
  LuWrench,
} from "react-icons/lu";
import { SubTitles } from "~/components/SubTitles";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Configuraciones de Productos" },
    { name: "description", content: "Configuraciones de Productos en StockAR" },
  ];
}

export default function ProductosSettings() {
  const navigate = useNavigate();
  const { carrozados } = useConfiguracion();
  return (
    <div
      className="container mx-auto h-full py-4 px-4 md:px-6"
      style={{ minHeight: "calc(100vh - 90px)" }}
    >
      <SubTitles
        title="Configuraciones Avanzadas"
        icon={{ component: LuWrench, color: "white" }}
        back_path="/configuraciones"
      />
      {carrozados.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <img src={logo} alt="No hay datos" className="w-32 h-32 opacity-50" />
          <div className="text-gray-500 text-lg text-center">
            <p>No hay carrozados configurados.</p>
            
            <p>Ve a <NavLink className={"dark:text-violet-400 text-violet-600 hover:underline"} to="/configuraciones/parametros-generales">parámetros generales</NavLink> y agrega uno</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 mx-auto gap-6 p-6 w-full">
          {carrozados.map((carrozado) => (
            <Card
              key={carrozado.id}
              className="hover:bg-violet-100/50 dark:hover:bg-violet-900/15 transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() =>
                navigate(
                  `/configuraciones/carrozados/valores-predefinidos/${carrozado.id}`,
                )
              }
            >
              <img src={carrozado.imagen_url || logo} alt={carrozado.nombre} />
              <h5 className="text-md font-bold tracking-tight text-gray-700 dark:text-white">
                {carrozado.nombre}
              </h5>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
