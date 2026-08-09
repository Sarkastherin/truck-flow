import type { Route } from "../+types/home";
import { useOutletContext, useNavigate } from "react-router";
import type { PedidoFormValues, TipoOrden } from "~/types/pedido";
import { LuHammer, LuBrush } from "react-icons/lu";
import { Button, Card } from "flowbite-react";
import { LoadingComponent } from "~/components/LoadingComponent";
import { useModal } from "~/context/ModalContext";
import OrdenTrabajoModal from "~/components/modals/customs/OrdenTrabajoModal";
import type { IconType } from "react-icons";
import { useMemo } from "react";
import { BadgeStatusOT } from "~/components/specials/Badges";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gestionar OT" },
    { name: "description", content: "Gestiona los detalles de la OT" },
  ];
}
type PropsOrdenes = {
  name: string;
  description: string;
  icon: IconType;
  tipo: TipoOrden;
  status: string | null;
};
export default function PedidosOrdenesTrabajo() {
  const pedido = useOutletContext() as PedidoFormValues;
  const { ordenes_trabajo, documentos } = pedido;
  const navigate = useNavigate();
  const { openModal } = useModal();

  const tiposOrdenes: PropsOrdenes[] = useMemo(() => {
    return [
      {
        name: "Fabricación",
        description:
          "Generar órden de trabajo para la fabricación de la carroceria según las especificaciones del pedido.",
        icon: LuHammer,
        tipo: "fabricacion",
        status:
          ordenes_trabajo?.find((ot) => ot.tipo_orden === "fabricacion")
            ?.status ?? null,
      },
      {
        name: "Pintura y Acabados",
        description:
          "Generar órden de trabajo para la pintura y acabados de componentes de la carroceria",
        icon: LuBrush,
        tipo: "pintura",
        status:
          ordenes_trabajo?.find((ot) => ot.tipo_orden === "pintura")?.status ??
          null,
      },
      {
        name: "Colocación y trabajos en chasis",
        description:
          "Generar órden de trabajo para la colocación y ensamblaje de componentes de la carroceria",
        icon: LuBrush,
        tipo: "montaje",
        status:
          ordenes_trabajo?.find((ot) => ot.tipo_orden === "montaje")?.status ??
          null,
      },
    ];
  }, [ordenes_trabajo]);

  if (pedido.id === undefined) {
    return <LoadingComponent />;
  }
  const handleOpenModal = (tipo: TipoOrden) => {
    openModal("custom", {
      title: "Generar Órden de Trabajo",
      size: "4xl",
      component: OrdenTrabajoModal,
      pedido,
      tipo,
      order: ordenes_trabajo?.find((ot) => ot.tipo_orden === tipo),
    });
  };
  return (
    <section className="ps-4 w-full">
      {pedido.carroceria && pedido.carroceria.id ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiposOrdenes.map(
            ({ name, description, icon: Icon, tipo, status }) => (
              <Card
                className="hover:bg-violet-100/50 dark:hover:bg-violet-900/15 transition-all duration-300 hover:scale-105 cursor-pointer"
                key={tipo}
                onClick={() => handleOpenModal(tipo)}
              >
                <div className="sm:mb-4 p-2.5 sm:p-3 rounded-xl  backdrop-blur-sm w-fit dark:bg-white/10 bg-gray-800/10">
                  <Icon className="h-8 w-8 dark:text-violet-400 text-violet-500" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold dark:text-white text-gray-800">
                  {name}
                </h2>
                <p className="text-sm dark:text-gray-300 text-gray-600">
                  {description}
                </p>
                <span className="w-fit">
                  <BadgeStatusOT status={status || ""} />
                </span>
              </Card>
            ),
          )}
        </div>
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 115px)" }}
        >
          <div className="flex flex-col gap-6">
            {pedido.carroceria_usada_id ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No aplica.
              </p>
            ) : (
              <>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No hay carrocería asociada a este pedido.
                </p>
                <Button
                  color={"violet"}
                  className="w-fit mx-auto"
                  onClick={() => navigate(`/pedidos/carroceria/${pedido.id}`)}
                >
                  Agregar Carrocería
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
