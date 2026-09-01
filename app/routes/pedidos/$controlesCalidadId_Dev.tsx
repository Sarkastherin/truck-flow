import type { Route } from "../+types/home";
import { useOutletContext, useNavigate } from "react-router";
import type { PedidoFormValues } from "~/types/pedido";
import { Button, Card } from "flowbite-react";
import { useModal } from "~/context/ModalContext";
import { useMemo } from "react";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { ControlCarrozadoForm } from "~/forms/ControlCarrozadoForm";
import { usePedido } from "~/context/PedidoContext";
import { useFormNavigationBlock } from "~/hooks/useFormNavigationBlock";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Controles de Calidad Beta" },
    {
      name: "description",
      content: "Gestiona los detalles de los controles de calidad",
    },
  ];
}
export type ControlCarrozadoForm = Pick<PedidoFormValues, "control_carrozado">;

export default function PedidosControlesCalidad() {
  const pedido = useOutletContext() as PedidoFormValues;
  const navigate = useNavigate();
  const [collapse, setCollapse] = useState(true);
  const { CUDcontrolCarrozado } = usePedido();
  const { openModal } = useModal();
  const shouldResetAfterSave = useRef(false);

  const { carrozados, puertasTraseras, colores, controlCarrozado } =
    useConfiguracion();
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

  const defaultValues = controlCarrozadoData.map((cc) => ({
    pedido_id: pedido.id,
    item_control_id: cc.item_control.id,
    revision: 0,
    resultado: null,
  }));
  const {
    register,
    control,
    watch,
    reset,
    setValue,
    clearErrors,
    formState: { errors, dirtyFields, isDirty, isSubmitSuccessful },
    handleSubmit,
  } = useForm<ControlCarrozadoForm>({
    defaultValues: {
      control_carrozado:
        pedido.control_carrozado?.length === 0
          ? defaultValues
          : pedido.control_carrozado,
    },
  });

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
  const onSubmit = async (data: ControlCarrozadoForm) => {
    openModal("loading", {
      props: {
        title: "Actualizando control de carrozado...",
      },
    });
    try {
      if (data.control_carrozado && data.control_carrozado.length > 0) {
        const controlCarrozadoWithRevision = data.control_carrozado.map(
          (item) => ({
            ...item,
            revision: item.id ? (item.revision ?? 0) + 1 : 0,
          }),
        );
        const { error } = await CUDcontrolCarrozado(
          controlCarrozadoWithRevision,
          [],
        );
        if (error) {
          throw new Error(`Error al guardar control de carrozado: ${error}`);
        }
        openModal("success", {
          props: {
            title: "Control de carrozado actualizados",
            message:
              "El control de carrozado ha sido actualizado exitosamente.",
          },
        });
        shouldResetAfterSave.current = true;
      } else {
        openModal("info", {
          props: {
            title: "Sin cambios",
            message: "No se han realizado cambios en el control de carrozado.",
          },
        });
      }
    } catch (error) {
      console.error("Error en onSubmit de PedidosForm:", error);
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Ocurrió un error al actualizar los trabajos en chasis. Por favor, intenta nuevamente.",
        },
      });
    }
  };
  useFormNavigationBlock<PedidoFormValues>({
    isDirty,
    isSubmitSuccessful,
    dirtyFields,
  });
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
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            <ControlCarrozadoForm
              register={register}
              setValue={setValue}
              control={control}
              controlCarrozadoData={controlCarrozadoData}
              pedido={pedido}
              watch={watch}
              errors={errors}
              clearErrors={clearErrors}
            />
            <div className="space-y-2">
              <Button type="submit" className="ml-auto block" disabled={false}>
                Guardar pedido
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
