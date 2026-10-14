import { NavLink, useNavigate } from "react-router";
import { LogoComponent } from "./LogoComponent";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import { useNavItems } from "~/hooks/useNavItems";
import {
  LuLogOut,
  LuShieldCheck,
  LuUserRound,
  LuCircleHelp,
} from "react-icons/lu";
import { optionsRoles } from "~/types/users";
import { useModal } from "~/context/ModalContext";
import HelpFAQModal from "./HelpFAQModal";
import {
  Avatar,
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Navbar,
  NavbarCollapse,
  NavbarToggle,
  DarkThemeToggle,
  useNavbarContext,
} from "flowbite-react";

function NavLinks() {
  const { setIsOpen } = useNavbarContext();
  const { navItems } = useNavItems();

  return (
    <NavbarCollapse>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `${isActive ? "bg-primary-600 dark:bg-primary-500 text-white dark:text-base-800" : " hover:bg-primary-400/50 hover:dark:bg-base-700/70"}  m-2 inline-flex items-center gap-1.5 px-2.5 py-2 rounded-full font-medium text-sm transition-colors duration-200`
            }
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {item.name}
          </NavLink>
        );
      })}
    </NavbarCollapse>
  );
}

export function NavBar() {
  const { activeUser, isLoading } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { openModal } = useModal();

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
      className="sticky top-0 z-50 border-b border-white/50 bg-linear-to-r from-slate-50 via-white to-primary-50/80 shadow-sm backdrop-blur-xl dark:border-base-700/70 dark:from-base-900 dark:via-base-900 dark:to-primary-950/40"
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
              color="primary"
            />
          }
        >
          <DropdownHeader>
            <span className="block text-sm">{fullName}</span>
            <span className="block truncate text-sm font-medium">
              {activeUser?.email}
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-base-500 dark:text-base-400 mt-2">
              <LuShieldCheck className="h-3.5 w-3.5 text-primary-500" />
              {isLoading
                ? "Sincronizando"
                : optionsRoles.find((r) => r.value === activeUser?.role)
                    ?.label || "Rol desconocido"}
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
        <button
          type="button"
          onClick={() =>
            openModal("custom", {
              title: "Centro de Ayuda",
              component: HelpFAQModal,
              size: "3xl"
            })
          }
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-base-200 bg-white/80 text-base-500 hover:bg-white hover:text-primary-600 dark:border-base-700 dark:bg-base-800/80 dark:text-base-400 dark:hover:bg-base-800 dark:hover:text-primary-400 transition-colors"
          title="Centro de Ayuda"
        >
          <LuCircleHelp className="h-5 w-5" />
        </button>
        <DarkThemeToggle className="ml-2 flex h-11 w-full items-center justify-center rounded-2xl border border-base-200 bg-white/80 hover:bg-white dark:border-base-700 dark:bg-base-800/80 dark:hover:bg-base-800 md:w-auto md:rounded-full" />
      </div>
      <NavLinks />
    </Navbar>
  );
}
