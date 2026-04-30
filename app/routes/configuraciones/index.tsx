import type { Route } from "../+types/home";
import { IoSettingsOutline } from "react-icons/io5";
import { Card } from "flowbite-react";
import { NavLink } from "react-router";
import { useNavItems } from "~/hooks/useNavItems";
import { SubTitles } from "~/components/SubTitles";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Configuraciones" },
    { name: "description", content: "Configuraciones en StockAR" },
  ];
}

export default function Configuraciones() {
  const { configItems } = useNavItems();
  return (
    <>
      <SubTitles
        title="Configuraciones"
        back_path="/"
        icon={{
          component: IoSettingsOutline,
          color: "text-purple-600 dark:text-purple-400",
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-15 auto-rows-fr">
        {configItems.map(
          ({ path, name, description, icon: { component: Icon, color } }) => (
            <NavLink key={path} to={path}>
              <Card className="hover:shadow-2xl hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 h-full flex flex-col cursor-pointer">
                <div className="flex items-center space-x-4">
                  <Icon className={`text-2xl ${color}`} />
                  <h2 className="text-xl font-semibold">{name}</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </Card>
            </NavLink>
          ),
        )}
      </div>
    </>
  );
}
