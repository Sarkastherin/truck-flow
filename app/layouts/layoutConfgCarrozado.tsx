import { Outlet, useLocation } from "react-router";
import { Sidebar } from "~/components/Sidebar";
import { LuFileCode, LuPencilRuler } from "react-icons/lu";
import { useParams } from "react-router";
import { useMemo } from "react";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import type { IconType } from "react-icons";
import { SubTitles } from "~/components/SubTitles";
export default function LayoutConfgCarrozado() {
  const location = useLocation();
  const { carrozadoId } = useParams();
  const { valoresPredefinidos, controlCarrozado, carrozados } = useConfiguracion();
  const valoresPredefinidoData = useMemo(() => {
    return valoresPredefinidos?.filter(
      (v) => String(v.carrozado_id) === carrozadoId,
    );
  }, [valoresPredefinidos, carrozadoId]);
  const controlCarrozadoData = useMemo(() => {
    return controlCarrozado?.filter(
      (c) => String(c.carrozado_id) === carrozadoId,
    );
  }, [controlCarrozado, carrozadoId]);
  const { state } = location;
  const menuItems = (id: string | undefined) => {
    if (!id) return [];
    return [
      {
        key: "valores-predefinidos",
        name: "Valores predefinidos",
        href: `/configuraciones/carrozados/valores-predefinidos/${id}`,
        icon: LuFileCode,
      },
      {
        key: "control-carrozado",
        name: "Control de carrozado",
        href: `/configuraciones/carrozados/control-carrozado/${id}`,
        icon: LuPencilRuler,
      },
    ];
  };
  const menu = menuItems(carrozadoId);
  const activeTab =
    menu.find((item) => location.pathname === item.href)?.key ??
    "valores-predefinidos";
  const iconActive = menu.find((item) => item.key === activeTab)?.icon;
  const nombreCarrozado = useMemo(() => {
    return carrozados?.find((c) => String(c.id) === carrozadoId)?.nombre;
  }, [carrozados, carrozadoId]);
  return (
    <div
      className="container mx-auto flex h-full pb-4"
      style={{ minHeight: "calc(100vh - 90px)" }}
    >
      <Sidebar submenu={menu} activeTab={activeTab} collapsible title={nombreCarrozado}/>
      <section className="w-full ps-6">
        <SubTitles
          title={`Gestión de ${activeTab.replace(/-/g, " ")}`}
          back_path="/configuraciones"
          icon={{
            component: iconActive as IconType,
            color: "text-blue-500",
          }}
        />
        <Outlet
          context={{
            valoresPredefinidoData,
            controlCarrozadoData,
            carrozadoId,
          }}
        />
      </section>
    </div>
  );
}
