import { NavLink, useNavigate } from "react-router";
import { LogoComponent } from "./LogoComponent";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import { useNavItems } from "~/hooks/useNavItems";
import { LuLogOut, LuShieldCheck, LuUserRound } from "react-icons/lu";
import {
  Avatar,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  DarkThemeToggle,
} from "flowbite-react";
const NavLinkComponent = ({
  children,
  to,
}: {
  children: React.ReactNode;
  to: string;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `inline-flex w-full items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 md:w-auto md:justify-start py-2 px-3 ${
        isActive
          ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30 dark:bg-violet-500"
          : "text-gray-600 hover:bg-white hover:text-violet-700 dark:text-gray-300 dark:hover:bg-gray-700/80 dark:hover:text-violet-300"
      }`
    }
  >
    {children}
  </NavLink>
);

export function NavBar() {
  const { activeUser, isLoading } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { navItems } = useNavItems();

  const fullName = activeUser
    ? `${activeUser.nombre} ${activeUser.apellido}`.trim()
    : "Cargando usuario";
  const initials = activeUser
    ? `${activeUser.nombre?.[0] ?? ""}${activeUser.apellido?.[0] ?? ""}`.toUpperCase()
    : "..";

  const handleLogout = async () => {
    try {
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesion:", error);
    }
  };

  return (
    <Navbar
      
      rounded
      className="sticky top-0 z-50 border-b border-white/50 bg-linear-to-r from-slate-50 via-white to-violet-50/80 shadow-sm backdrop-blur-xl dark:border-gray-700/70 dark:from-gray-900 dark:via-gray-900 dark:to-violet-950/40"
    >
      <NavLink to="/">
        <LogoComponent />
      </NavLink>
      <div className="flex md:order-2">
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <Avatar
              placeholderInitials={initials}
              rounded
              bordered
              color="purple"
            />
          }
        >
          <DropdownHeader>
            <span className="block text-sm">{fullName}</span>
            <span className="block truncate text-sm font-medium">
              {activeUser?.email}
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <LuShieldCheck className="h-3.5 w-3.5 text-violet-500" />
              {isLoading ? "Sincronizando" : (activeUser?.role ?? "Usuario")}
            </span>
          </DropdownHeader>
          <DropdownDivider />
          <DropdownItem
            onClick={handleLogout}
            className="hover:bg-red-200/50 hover:text-red-500 hover:dark:bg-red-600/40 hover:dark:text-red-300"
          >
            <LuLogOut className="h-4.5 w-4.5 mr-2" />
            Cerrar sesión
          </DropdownItem>
        </Dropdown>
        <NavbarToggle className="ml-2" />
        <DarkThemeToggle className="ml-2 flex h-11 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white/80 hover:bg-white dark:border-gray-700 dark:bg-gray-800/80 dark:hover:bg-gray-800 md:w-auto md:rounded-full" />
      </div>
      <NavbarCollapse>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${isActive ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30 dark:bg-violet-500 hover:bg-violet-600 hover:text-white hover:dark:bg-violet-500" : "hover:bg-violet-300 hover:dark:bg-violet-600/50 "}  m-2 px-2.5 py-2 rounded-full font-medium text-sm transition-colors duration-200`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </NavbarCollapse>
    </Navbar>
  );
}
