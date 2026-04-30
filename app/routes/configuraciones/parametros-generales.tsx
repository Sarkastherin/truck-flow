import { useState } from "react";
import type { Route } from "../+types/home";
import { Sidebar } from "~/components/Sidebar";
import { TableComponent } from "~/components/TableComponent";
import useItemsConfig from "~/hooks/useItemsConfig";
import { FaPlus } from "react-icons/fa";
import { Button } from "flowbite-react";
import { SubTitles } from "~/components/SubTitles";
import {
  LuPaintBucket,
  LuTruck,
  LuDoorOpen,
  LuContactRound,
  LuDrill,
  LuPencilRuler,
} from "react-icons/lu";
import type { IconType } from "react-icons";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Configuraciones de Productos" },
    { name: "description", content: "Configuraciones de Productos en StockAR" },
  ];
}
export type TabsTypes =
  | "colores"
  | "carrozados"
  | "puertas_traseras"
  | "personal"
  | "trabajos_chasis"
  | "items_control";

const submenu: { key: TabsTypes; name: string; icon: IconType }[] = [
  {
    key: "colores" as TabsTypes,
    name: "Colores",
    icon: LuPaintBucket,
  },
  {
    key: "carrozados" as TabsTypes,
    name: "Carrozados",
    icon: LuTruck,
  },
  {
    key: "puertas_traseras" as TabsTypes,
    name: "Puertas traseras",
    icon: LuDoorOpen,
  },
  {
    key: "personal" as TabsTypes,
    name: "Personal",
    icon: LuContactRound,
  },
  {
    key: "trabajos_chasis" as TabsTypes,
    name: "Trabajos chasis",
    icon: LuDrill,
  },
  {
    key: "items_control" as TabsTypes,
    name: "Items de control",
    icon: LuPencilRuler,
  },
];

export default function ParametrosGenerales() {
  const { getItemsConfig } = useItemsConfig();
  const [activeTab, setActiveTab] = useState<TabsTypes>("colores");
  const itemsConfig = getItemsConfig();
  const activeItem = itemsConfig.find((item) => item.tab === activeTab);
  const iconActive = submenu.find((item) => item.key === activeTab)?.icon;
  return (
    <div
      className="flex h-full"
      style={{ minHeight: "calc(100vh - 110px)" }}
    >
      <Sidebar
        aria-label="Menu de configuraciones de productos"
        submenu={submenu}
        activeTab={activeTab}
        setActiveTab={setActiveTab as (tab: string) => void}
        collapsible
      />
      <div className="relative flex-1 min-w-0 p-6 pt-0 pb-0">
        {activeItem && (
          <div key={activeItem.tab}>
            <div className="flex justify-between items-center mb-4">
              <SubTitles
                title={`Gestión de ${activeItem.name}`}
                back_path="/configuraciones"
                icon={{
                  component: iconActive as IconType,
                  color: "text-blue-500",
                }}
              />
              <div>
                <Button size="sm" color="violet" onClick={activeItem.onOpenNew}>
                  <FaPlus className="mr-2" />
                  Nuevo {activeItem.singularName}
                </Button>
              </div>
            </div>
            <TableComponent
              columns={activeItem.columns}
              data={activeItem.data}
              onRowClick={activeItem.onOpenDetails}
              filterFields={activeItem.filterFields}
              scrollHeightOffset={375}
              inactiveField="active"
              emptyState={{
                title: `No hay ${activeItem.name.toLowerCase()} cargadas`,
                description: `Puedes crear la primera ${activeItem.singularName.toLowerCase()} para comenzar.`,
                actionLabel: `Crear ${activeItem.singularName}`,
                onAction: activeItem.onOpenNew,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
