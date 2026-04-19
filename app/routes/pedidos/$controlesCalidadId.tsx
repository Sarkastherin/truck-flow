import type { Route } from "../+types/home";
import { useOutletContext, useNavigate } from "react-router";
import type { PedidoFormValues, TipoOrden } from "~/types/pedido";
import { LuShieldCheck } from "react-icons/lu";
import { Button, Card } from "flowbite-react";
import { useModal } from "~/context/ModalContext";
import OrdenTrabajoModal from "~/components/modals/customs/OrdenTrabajoModal";
import type { IconType } from "react-icons";
import { useMemo } from "react";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import { BadgeStatusOT } from "~/components/specials/Badges";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Controles de Calidad" },
    {
      name: "description",
      content: "Gestiona los detalles de los controles de calidad",
    },
  ];
}
type PropsOrdenes = {
  name: string;
  description: string;
  icon: IconType;
  tipo: TipoOrden;
  status: string | null;
};
export default function PedidosControlesCalidad() {
  const pedido = useOutletContext() as PedidoFormValues;
  const { controlCarrozado } = useConfiguracion();
  const { ordenes_trabajo } = pedido;
  const navigate = useNavigate();
  const { openModal } = useModal();

  const tiposControles: PropsOrdenes[] = useMemo(() => {
    return [
      {
        name: "Carrozado",
        description:
          "Generar el control de calidad del proceso de carrozado, asegurando que la carroceria cumpla con los estándares de calidad antes de su finalización.",
        icon: LuShieldCheck,
        tipo: "control_carrozado",
        status:
          ordenes_trabajo?.find((ot) => ot.tipo_orden === "control_carrozado")
            ?.status ?? null,
      },
    ];
  }, [ordenes_trabajo]);

  const controlCarrozadoData = useMemo(() => {
    return controlCarrozado
      .filter(
        (control) =>
          control.carrozado_id === pedido.carroceria?.tipo_carrozado_id,
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [controlCarrozado, pedido.carroceria?.tipo_carrozado_id]);
  const handleOpenModal = (tipo: TipoOrden) => {
    openModal("custom", {
      title: "Generar Órden de Trabajo",
      size: "4xl",
      component: OrdenTrabajoModal,
      pedido,
      tipo,
      order: ordenes_trabajo?.find((ot) => ot.tipo_orden === tipo),
      controlCarrozado: controlCarrozadoData,
    });
  };
  if (!pedido?.carroceria?.id) {
    return (
      <section className="ps-4 w-full">
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 115px)" }}
        >
          <div className="flex flex-col gap-6">
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
          </div>
        </div>
      </section>
    );
  }
  if (controlCarrozadoData.length === 0) {
    return (
      <section className="ps-4 w-full">
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 115px)" }}
        >
          <div className="flex flex-col gap-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              No hay controles de calidad disponibles para este pedido.
            </p>
            <Button
              color={"yellow"}
              className="w-fit mx-auto"
              onClick={() =>
                navigate(
                  `/configuraciones/carrozados/control-carrozado/${pedido.carroceria?.tipo_carrozado_id}`,
                )
              }
            >
              Defina los controles aquí
            </Button>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="ps-4 w-full">
      {pedido.carroceria && pedido.carroceria.id && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiposControles.map(
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
      )}
    </section>
  );
}
