import { Outlet, useLocation } from "react-router";
import { Sidebar } from "~/components/Sidebar";
import {
  LuFolderOpenDot,
  LuTruck,
  LuLayoutPanelTop,
  LuDrill,
  LuFileBox,
  LuShieldCheck,
} from "react-icons/lu";
import { useParams } from "react-router";
import { usePedido } from "~/context/PedidoContext";
import { useMemo } from "react";
import { useModal } from "~/context/ModalContext";
import { useNavigate } from "react-router";
import { MODE_DEV } from "~/backend/Database/SheetsConfig";
import ButtonPrestamo from "~/components/specials/ButtonPrestamo";
import { Button } from "flowbite-react";
export default function PedidosLayout() {
  const location = useLocation();
  const { pedidoId } = useParams();
  const { pedidos, deletePedido, updatePedido } = usePedido();
  const { openModal, closeModal } = useModal();
  const navigate = useNavigate();

  const pedido = pedidos?.find((p) => String(p.id) === pedidoId);
  const sumFormasPago = useMemo(() => {
    if (!pedido) return 0;
    const total =
      pedido.formas_pago?.reduce((acc, forma) => acc + forma.monto, 0) ?? 0;
    return total;
  }, [pedido]);
  const isMatch = sumFormasPago === pedido?.precio;
  const menuItems = (id: string | undefined) => {
    if (!id) return [];
    return [
      {
        key: "pedido",
        name: "Pedido",
        href: `/pedidos/${id}`,
        icon: LuFolderOpenDot,
        alert: {
          showAlert: !isMatch,
          alertMessage: `El total de las formas de pago (${sumFormasPago}) no coincide con el precio del pedido (${pedido?.precio}). Revisa las formas de pago.`,
        },
      },
      {
        key: "camion",
        name: "Camión",
        href: `/pedidos/camion/${id}`,
        icon: LuTruck,
        alert: {
          showAlert: Object.entries(pedido?.camion ?? {}).length === 0,
          alertMessage: "El pedido no tiene información del camión.",
        },
      },
      {
        key: "carroceria",
        name: "Carrocería",
        href: `/pedidos/carroceria/${id}`,
        icon: LuLayoutPanelTop,
        show: pedido?.tipo === "nueva",
        alert: {
          showAlert: Object.entries(pedido?.carroceria ?? {}).length === 0,
          alertMessage: "El pedido no tiene información de la carrocería.",
        },
      },
      {
        key: "carroceria_usada",
        name: "Carrocería Usada",
        href: `/pedidos/carroceria-usada/${id}`,
        icon: LuLayoutPanelTop,
        show: MODE_DEV && pedido?.tipo === "usada",
        alert: {
          showAlert: !pedido?.carroceria_usada_id,
          alertMessage:
            "El pedido no tiene información de la carrocería usada.",
        },
      },
      {
        key: "trabajo-chasis",
        name: "Trabajo en Chasis",
        href: `/pedidos/trabajos-chasis/${id}`,
        icon: LuDrill,
      },
      {
        key: "datos-colocacion",
        name: "Datos de Colocación",
        href: `/pedidos/datos-colocacion/${id}`,
        icon: LuTruck,
        show: pedido?.tipo === "nueva",
      },
      {
        key: "ordenes-trabajo",
        name: "Órdenes de Trabajo",
        href: `/pedidos/ordenes-trabajo/${id}`,
        icon: LuFileBox,
        show: pedido?.tipo === "nueva",
      },
      {
        key: "controles-calidad",
        name: "Controles de Calidad",
        href: `/pedidos/controles-calidad/${id}`,
        icon: LuShieldCheck,
        show: pedido?.tipo === "nueva",
      },
    ];
  };
  const menu = menuItems(pedido?.id);
  const activeTab =
    menu.find((item) => location.pathname === item.href)?.key ?? "pedido";

  if (!pedido) {
    return null;
  }
  const handleDeletePedido = async () => {
    if (!pedido) return;
    openModal("confirmation", {
      props: {
        title: "Confirmar Eliminación",
        description:
          "¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.",
        onConfirm: async () => {
          openModal("loading", { title: "Eliminando Pedido..." });
          try {
            const { error } = await deletePedido(pedido.id);
            if (error) {
              throw new Error("Error al eliminar el pedido: " + error);
            }
            openModal("success", {
              title: "Pedido Eliminado",
              description: "El pedido ha sido eliminado exitosamente.",
            });
            navigate("/pedidos");
          } catch (error) {
            openModal("error", {
              title: "Error al eliminar el pedido",
              description:
                "Ocurrió un error al intentar eliminar el pedido. Por favor, intenta nuevamente.",
            });
          }
        },
      },
    });
  };
  return (
    <div className="flex h-full" style={{ minHeight: "calc(100vh - 110px)" }}>
      <Sidebar
        submenu={menu}
        activeTab={activeTab}
        collapsible
        title={`Pedido #${pedido.numero_pedido}`}
      >
        {MODE_DEV && (
          <ButtonPrestamo pedido={pedido} />
        )}
        <div className="mt-6 p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Zona de Peligro
            </h4>
          </div>
          <p className="text-xs text-red-600 dark:text-red-300 mb-3 leading-relaxed">
            Una vez eliminado, este pedido y todos sus datos asociados se
            perderán permanentemente.
          </p>
          <Button
            type="button"
            color="red"
            size="sm"
            onClick={handleDeletePedido}
            className="w-full text-xs"
          >
            {`Eliminar ${pedido.numero_pedido}`}
          </Button>
        </div>
      </Sidebar>
      <Outlet context={pedido} />
    </div>
  );
}
