import { useEffect, useState } from "react";
import {
  Button,
  Sidebar as FlowbiteSidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import type { IconType } from "react-icons";
import type { SidebarProps } from "flowbite-react";
import { LuChevronLeft, LuChevronRight, LuCircleAlert } from "react-icons/lu";
import { useLocation, useNavigate } from "react-router";

export function Sidebar({
  submenu,
  activeTab,
  setActiveTab,
  collapsible = false,
  dangerZone = false,
  propsDangerZone,
  ...props
}: {
  submenu: {
    key: string;
    name: string;
    href?: string;
    icon: IconType;
    show?: boolean;
    alert?: {
      showAlert: boolean;
      alertMessage: string;
    };
  }[];
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  collapsible?: boolean;
  dangerZone?: boolean;
  propsDangerZone?: {
    itemName?: string;
    description?: string;
    onDelete?: () => void;
  };
} & SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncCollapsedWithViewport = () => {
      setCollapsed(window.innerWidth < 768);
    };

    syncCollapsedWithViewport();
    window.addEventListener("resize", syncCollapsedWithViewport);

    return () => {
      window.removeEventListener("resize", syncCollapsedWithViewport);
    };
  }, []);
  return (
    <div
      className={`relative shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="overflow-hidden w-full h-full">
        <FlowbiteSidebar collapsed={collapsed} {...props}>
          <SidebarItems>
            {props.title && (
              <span>
                <h5
                  className={`${collapsed ? "hidden" : "font-bold text-center w-full text-sm bg-violet-200/50 rounded py-2 text-gray-700"}`}
                >
                  {props.title}
                </h5>
              </span>
            )}
            <SidebarItemGroup>
              {submenu.map((item) => {
                if (item.show === false) {
                  return null;
                }
                return (
                  <div key={item.key} className="relative">
                    <SidebarItem
                      key={item.key}
                      onClick={() => {
                        if (item.href) {
                          navigate(item.href);
                        }
                        if (setActiveTab) {
                          setActiveTab(item.key);
                        }
                      }}
                      icon={item.icon}
                      active={
                        activeTab === item.key ||
                        location.pathname === item.href
                      }
                      className="cursor-pointer"
                    >
                      {item.name}
                    </SidebarItem>
                    {item.alert && item.alert.showAlert && (
                      <span
                        className={`${collapsed ? "hidden" : "block"} absolute right-4 top-1/2 transform -translate-y-1/2`}
                        title={item.alert.alertMessage}
                      >
                        <LuCircleAlert size={16} className="text-red-500" />
                      </span>
                    )}
                  </div>
                );
              })}
            </SidebarItemGroup>
            {/* Zona de peligro */}
            {dangerZone && !collapsed && (
              <div className="mt-6 mb-16 p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Zona de Peligro
                  </h4>
                </div>
                <p className="text-xs text-red-600 dark:text-red-300 mb-3 leading-relaxed">
                  {propsDangerZone?.description ||
                    "Ten cuidado al realizar esta acción, no se puede deshacer."}
                </p>
                <Button
                  type="button"
                  color="red"
                  size="sm"
                  onClick={propsDangerZone?.onDelete}
                  className="w-full text-xs"
                >
                  {`Eliminar ${propsDangerZone?.itemName || "Pedido"}`}
                </Button>
              </div>
            )}
          </SidebarItems>
        </FlowbiteSidebar>
      </div>
      {collapsible && (
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex absolute -right-3 top-5 z-10 h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? (
            <LuChevronRight size={12} />
          ) : (
            <LuChevronLeft size={12} />
          )}
        </button>
      )}
    </div>
  );
}
