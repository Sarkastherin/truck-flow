import type { Route } from "../+types/home";
import { TrabajosChasisForm } from "~/forms/TrabajosChasisForm";
import { useOutletContext } from "react-router";
import type { PedidoFormValues } from "~/types/pedido";
import { useForm } from "react-hook-form";
import { Button } from "flowbite-react";
import { useModal } from "~/context/ModalContext";
import { usePedido } from "~/context/PedidoContext";
import { useState, useEffect, useRef } from "react";
import { useFormNavigationBlock } from "~/hooks/useFormNavigationBlock";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Editar Chasis" },
    { name: "description", content: "Edita los detalles del chasis" },
  ];
}
export default function PedidosTrabajosChasis() {
  const pedido = useOutletContext() as PedidoFormValues;
  const {} = pedido;
  const { openModal } = useModal();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const { CUDTrabajosChasis } = usePedido();
  const shouldResetAfterSave = useRef(false);
  const {
    register,
    control,
    watch,
    reset,
    formState: { errors, dirtyFields, isDirty, isSubmitSuccessful },
    handleSubmit,
  } = useForm<Pick<PedidoFormValues, "trabajo_chasis">>({
    defaultValues: {
      trabajo_chasis: pedido.trabajo_chasis || [],
    },
  });

  useEffect(() => {
    if (shouldResetAfterSave.current) {
      reset({ trabajo_chasis: pedido.trabajo_chasis || [] });
      shouldResetAfterSave.current = false;
    }
  }, [pedido.trabajo_chasis, reset]);
  const onSubmit = async (data: Pick<PedidoFormValues, "trabajo_chasis">) => {
    openModal("loading", {
      props: {
        title: "Actualizando trabajos en chasis...",
      },
    });
    try {
      if (
        (data.trabajo_chasis && data.trabajo_chasis.length > 0) ||
        deletedIds.length > 0
      ) {
        const { error } = await CUDTrabajosChasis(
          data.trabajo_chasis || [],
          deletedIds,
        );
        if (error) {
          throw new Error(`Error al guardar trabajos en chasis: ${error}`);
        }
        openModal("success", {
          props: {
            title: "Trabajos en chasis actualizados",
            message:
              "Los trabajos en chasis han sido actualizados exitosamente.",
          },
        });
        shouldResetAfterSave.current = true;
      } else {
        openModal("info", {
          props: {
            title: "Sin cambios",
            message: "No se han realizado cambios en los trabajos en chasis.",
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
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
        <TrabajosChasisForm
          register={register}
          control={control}
          watch={watch}
          errors={errors}
          pedidoId={pedido.id}
          setDeletedIds={setDeletedIds}
        />
        <div className="space-y-2">
          <Button type="submit" className="ml-auto block" disabled={false}>
            Guardar pedido
          </Button>
        </div>
      </form>
    </section>
  );
}
