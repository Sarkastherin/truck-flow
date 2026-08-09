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
import { useState } from "react";
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
  const { ordenes_trabajo } = pedido;
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [collapse, setCollapse] = useState(true);

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
  const {
    armadoresOptions,
    pintoresOptions,
    montadoresOptions,
    carrozados,
    puertasTraseras,
    colores,
    trabajosChasis,
    controlCarrozado,
  } = useConfiguracion();
  const controlCarrozadoData = useMemo(() => {
    return controlCarrozado
      .filter(
        (control) =>
          control.carrozado_id === pedido.carroceria?.tipo_carrozado_id,
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [controlCarrozado, pedido.carroceria?.tipo_carrozado_id]);
  const carrozadoNombre = useMemo(() => {
    return (
      carrozados.find((c) => c.id === pedido.carroceria?.tipo_carrozado_id)
        ?.nombre ?? "—"
    );
  }, [carrozados, pedido.carroceria?.tipo_carrozado_id]);
  const puertaTraseraNombre = useMemo(() => {
    return (
      puertasTraseras.find((p) => p.id === pedido.carroceria?.puerta_trasera_id)
        ?.nombre ?? "—"
    );
  }, [puertasTraseras, pedido.carroceria?.puerta_trasera_id]);
  const colorCarrozadoNombre = useMemo(() => {
    return (
      colores.find((c) => c.id === pedido.carroceria?.color_carrozado_id)
        ?.nombre ?? "—"
    );
  }, [colores, pedido.carroceria?.color_carrozado_id]);
  const colorZocaloNombre = useMemo(() => {
    return (
      colores.find((c) => c.id === pedido.carroceria?.color_zocalo_id)
        ?.nombre ?? "—"
    );
  }, [colores, pedido.carroceria?.color_zocalo_id]);
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
  if (pedido?.carroceria_usada_id) {
    return (
      <section className="ps-4 w-full">
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 115px)" }}
        >
          <div className="flex flex-col gap-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              No aplica.
            </p>
          </div>
        </div>
      </section>
    );
  }
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
  const InfoField = ({ label, value }: { label: string; value: any }) => (
    <p className="text-sm text-gray-600 dark:text-gray-300 ">
      {label}: <strong>{value || "-"}</strong>
    </p>
  );
  return (
    <section className="ps-4 w-full">
      {pedido.carroceria && pedido.carroceria.id && (
        <>
          <Card className="w-full mx-auto mt-4 shadow-lg border border-violet-200 bg-white dark:bg-gray-800">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-2">
              <div>
                <p className="text-xs text-violet-700 dark:text-violet-300 tracking-widest uppercase font-semibold">
                  Tipo de carrozado
                </p>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-white">
                  {carrozadoNombre || "-"}
                </h2>
              </div>
              <div>
                <button
                  className="text-sm text-violet-700 dark:text-violet-300 underline"
                  onClick={() => setCollapse(!collapse)}
                >
                  {collapse ? "Mostrar" : "Ocultar"} detalles
                </button>
              </div>
            </div>
            <div
              className={`flex flex-col gap-4 ${collapse ? "hidden" : "block"}`}
            >
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 `}
              >
                <InfoField
                  label="Ancho Ext"
                  value={pedido.carroceria.ancho_ext || "-"}
                />
                <InfoField
                  label="Ancho Int"
                  value={pedido.carroceria.ancho_int || "-"}
                />
                <div className="col-span-2">
                  <InfoField
                    label="Puerta Trasera"
                    value={puertaTraseraNombre || "-"}
                  />
                </div>
                <div className="col-span-2">
                  <InfoField
                    label="Color carrozado"
                    value={colorCarrozadoNombre || "-"}
                  />
                </div>

                <div className="col-span-2">
                  <InfoField
                    label="Color zócalo"
                    value={colorZocaloNombre || "-"}
                  />
                </div>
                <div className="col-span-full border-t border-gray-300 dark:border-gray-500"></div>
                <div
                  className={`${pedido.carroceria.cuchetin ? "col-span-1" : "col-span-4"}`}
                >
                  <InfoField
                    label="Cuchetín"
                    value={pedido.carroceria.cuchetin ? "Sí" : "No"}
                  />
                </div>
                {pedido.carroceria.cuchetin && (
                  <>
                    <InfoField
                      label="Medida:"
                      value={pedido.carroceria.med_cuchetin}
                    />
                    <InfoField
                      label="Alto de puerta:"
                      value={pedido.carroceria.alt_pta_cuchetin}
                    />
                    <InfoField
                      label="Altura techo:"
                      value={pedido.carroceria.alt_techo_cuchetin}
                    />
                  </>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
