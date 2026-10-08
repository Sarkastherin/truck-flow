import { useMemo, type ComponentType } from "react";
import { useUser } from "~/context/UserContext";
import type { IconType } from "react-icons";
import { FiDownload } from "react-icons/fi";
import { LuFileCog, LuSettings2, LuUserRoundCog } from "react-icons/lu";
import { FaBuildingUser } from "react-icons/fa6";
import { TbSitemap } from "react-icons/tb";
import type { Role } from "~/types/users";
import { FaUsers, FaGift, FaMoneyBill } from "react-icons/fa";
import { MODE_DEV } from "~/backend/Database/SheetsConfig";

export type NavItem = {
  name: string;
  to: string;
  icon?: ComponentType<{ className?: string }>;
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
  hidden?:boolean
};

const allNavItems: (NavItem & { allowedRoles: Role[] })[] = [
  {
    name: "Inicio",
    to: "/",
    allowedRoles: ["ADMIN", "SELLER"],
  },
  {
    name: "Pedidos",
    to: "/pedidos",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Administración",
    to: "/administracion",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Configuraciones",
    to: "/configuraciones",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Stock Usadas",
    to: "/carrocerias-usadas",
    allowedRoles: ["ADMIN", "SELLER"],
  },
  {
    name: "RRHH",
    to: "/rrhh",
    allowedRoles: ["ADMIN"],
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
      component: FaBuildingUser,
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
  {
    name: "Usuarios y Roles",
    path: "/configuraciones/usuarios-roles",
    description:
      "Gestiona los usuarios y roles del sistema, asigna permisos y controla el acceso a las diferentes funcionalidades.",
    icon: { component: LuUserRoundCog, color: "text-orange-600 dark:text-orange-400" },
    allowedRoles: ["ADMIN"],
  },
];
const allAdminItems: (ConfigItem & { allowedRoles: Role[] })[] = [
  {
    name: "Cuentas Corrientes",
    path: "/administracion/cuentas-corrientes",
    description:
      "Administra las cuentas corrientes de tus clientes y proveedores, visualiza mvto_empleados, movimientos y más.",
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
const allRRHHItems: (ConfigItem & { allowedRoles: Role[] })[] = [
  {
    name: "Nómina de empleados",
    path: "/rrhh/nomina",
    description:
      "Gestiona todos los datos de los empleados",
    icon: {
      component: FaUsers,
      color: "text-blue-600 dark:text-blue-400",
    },
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Premios",
    path: "/rrhh/premios",
    description:
      "Gestiona el sistema de premios, actualiza o añade nuevos",
    icon: {
      component: FaGift,
      color: "text-pink-600 dark:text-pink-400",
    },
    allowedRoles: ["ADMIN"],
    hidden:!MODE_DEV
  },
  {
    name: "Deudores (Empleados)",
    path: "/rrhh/saldos",
    description:
      "Ingresa los prestamos, adelantos otorgado a los trabajadores",
    icon: {
      component: FaMoneyBill,
      color: "text-green-600 dark:text-green-400",
    },
    allowedRoles: ["ADMIN"],
    hidden:!MODE_DEV
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
  const rrhhItems = useMemo(
    () => allRRHHItems.filter((item) => item.allowedRoles.includes(role)),
    [role],
  );

  return { navItems, quickActions, configItems, adminItems, rrhhItems };
}
