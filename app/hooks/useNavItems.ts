import { useMemo } from "react";
import { useUser } from "~/context/UserContext";
import type { IconType } from "react-icons";
import { FiDownload } from "react-icons/fi";
import { LuFileCog, LuSettings2, LuUserRoundCog } from "react-icons/lu";
import { TbSitemap } from "react-icons/tb";
import type { Role } from "~/types/users";

export type NavItem = {
  name: string;
  to: string;
};

export type QuickAction = {
  name: string;
  to: string;
  icon: {
    component: IconType;
    color: string;
    size: number;
  };
  color: string;
};

export type ConfigItem = {
  name: string;
  path: string;
  icon: { component: IconType; color: string };
  description: string;
};

const allNavItems: (NavItem & { allowedRoles: Role[] })[] = [
  {
    name: "Inicio",
    to: "/",
    allowedRoles: ["DEV","USER", "ADMIN", "SELLER"],
  },
  {
    name: "Pedidos",
    to: "/pedidos",
    allowedRoles: ["DEV","USER", "ADMIN"],
  },
  {
    name: "Administración",
    to: "/administracion",
    allowedRoles: ["DEV","SUPERVISOR", "ADMIN"],
  },
  {
    name: "Configuraciones",
    to: "/configuraciones",
    allowedRoles: ["DEV","ADMIN"],
  },
  {
    name: "Stock Usadas",
    to: "/carrocerias-usadas",
    allowedRoles: ["DEV"],
  },
];

const allQuickActions: (QuickAction & { allowedRoles: Role[] })[] = [];

const allConfigItems: (ConfigItem & { allowedRoles: Role[] })[] = [
  {
    name: "Socios Comerciales",
    path: "/configuraciones/socios-comerciales",
    description:
      "Gestiona tus clientes, proveedores y otros socios comerciales en un solo lugar.",
    icon: {
      component: LuUserRoundCog,
      color: "text-green-600 dark:text-green-400",
    },
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Parámetros generales",
    path: "/configuraciones/parametros-generales",
    description:
      "Configura los parámetros generales del sistema, como unidades de medida, moneda, etc.",
    icon: { component: LuSettings2, color: "text-blue-600 dark:text-blue-400" },
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Carrozados",
    path: "/configuraciones/carrozados",
    description:
      "Configuraciones específicas para carrozados, valores predefinidas, controles de calidad, etc.",
    icon: { component: LuFileCog, color: "text-red-600 dark:text-red-400" },
    allowedRoles: ["ADMIN"],
  },
];
const allAdminItems: (ConfigItem & { allowedRoles: Role[] })[] = [
  {
    name: "Cuentas Corrientes",
    path: "/administracion/cuentas-corrientes",
    description:
      "Administra las cuentas corrientes de tus clientes y proveedores, visualiza saldos, movimientos y más.",
    icon: {
      component: TbSitemap,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Cheques",
    path: "/administracion/cheques",
    description:
      "Gestiona los cheques emitidos y recibidos, realiza seguimiento de pagos y cobros.",
    icon: {
      component: FiDownload,
      color: "text-purple-600 dark:text-purple-400",
    },
    allowedRoles: ["ADMIN"],
  },
];

export function useNavItems() {
  const { activeUser } = useUser();
  const role: Role = activeUser?.role ?? "USER";

  const navItems = useMemo(
    () => allNavItems.filter((item) => item.allowedRoles.includes(role)),
    [role],
  );

  const quickActions = useMemo(
    () => allQuickActions.filter((item) => item.allowedRoles.includes(role)),
    [role],
  );

  const configItems = useMemo(
    () => allConfigItems.filter((item) => item.allowedRoles.includes(role)),
    [role],
  );
  const adminItems = useMemo(
    () => allAdminItems.filter((item) => item.allowedRoles.includes(role)),
    [role],
  );

  return { navItems, quickActions, configItems, adminItems };
}
