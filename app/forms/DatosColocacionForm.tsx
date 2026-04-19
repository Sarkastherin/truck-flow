import { useForm } from "react-hook-form";
import AccesoriosForm from "./AccesoriosForm";
import AlarguesForm from "./AlarguesForm";
import { TrabajosChasisForm } from "./TrabajosChasisForm";
import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
  Button,
} from "flowbite-react";
import { useState } from "react";
import type {
  TrabajoChasis,
  Camion,
  PedidoFormValues,
  Carroceria,
} from "~/types/pedido";
import { PhoneInput, Input } from "~/components/InputsForm";
import { useModal } from "~/context/ModalContext";
import { usePedido } from "~/context/PedidoContext";

type FormValues = {
  carroceria: Carroceria;
  trabajo_chasis: TrabajoChasis[];
  camionData: Camion;
};
export default function DatosColocacion({
  pedido,
}: {
  pedido: PedidoFormValues;
}) {
  const { openModal } = useModal();
  const { updateCamionBase, updateCarroceriaBase, CUDTrabajosChasis } =
    usePedido();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    defaultValues: {
      carroceria: pedido.carroceria || undefined,
      trabajo_chasis: pedido.trabajo_chasis || [],
      camionData: pedido.camion || undefined,
    },
  });
  const onSubmit = async (data: FormValues) => {
    openModal("loading", {
      props: {
        title: "Guardando datos de colocación...",
      },
    });
    try {
      const { camionData, carroceria, trabajo_chasis } = data;
      if (Object.keys(dirtyFields).length === 0) {
        openModal("info", {
          props: {
            title: "Sin cambios",
            message: "No se han realizado cambios en los datos de colocación.",
          },
        });
        return;
      }
      // Actualizar camión si hay cambios
      if (dirtyFields.camionData) {
        const { error } = await updateCamionBase(
          camionData,
          dirtyFields.camionData,
        );
        if (error) {
          throw new Error("Error al actualizar datos del camión");
        }
      }
      if (dirtyFields.carroceria) {
        const { error } = await updateCarroceriaBase(
          carroceria,
          dirtyFields.carroceria,
        );
        if (error) {
          throw new Error("Error al actualizar datos de la carrocería");
        }
      }
      if (trabajo_chasis.length > 0 || deletedIds.length > 0) {
        if (dirtyFields.trabajo_chasis) {
          const { error } = await CUDTrabajosChasis(trabajo_chasis, deletedIds);
          if (error) {
            throw new Error("Error al actualizar trabajos de chasis");
          }
        }
      }
      openModal("success", {
        props: {
          title: "Datos de colocación actualizados",
          message: "Los datos de colocación se han actualizado correctamente.",
        },
      });
    } catch (error) {
      console.error("Error al guardar datos de colocación:", error);
      openModal("error", {
        props: {
          title: "Error",
          message:
            "Hubo un error al guardar los datos de colocación. Por favor, intenta nuevamente.",
        },
      });
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <AccesoriosForm
        register={register}
        watch={watch}
        setValue={setValue}
        withAccordion={true}
        errors={errors}
        namePrefix="carroceria"
      />
      <AlarguesForm
        register={register}
        watch={watch}
        setValue={setValue}
        withAccordion={true}
        errors={errors}
        namePrefix="carroceria"
      />
      <TrabajosChasisForm
        register={register}
        control={control}
        watch={watch}
        errors={errors}
        fieldArrayPath="trabajo_chasis"
        setDeletedIds={setDeletedIds}
      />
      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Datos de camión</AccordionTitle>
          <AccordionContent>
            <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Patente"
                {...register("camionData.patente")}
                placeholder="Patente del camión"
              />
              <Input
                label="Nombre de contacto"
                {...register("camionData.contacto_nombre")}
                placeholder="Nombre de contacto"
              />
              <PhoneInput
                label="Contacto"
                value={watch("camionData.contacto_telefono") || ""}
                onChange={(value) =>
                  setValue("camionData.contacto_telefono", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={errors.camionData?.contacto_telefono?.message}
              />
            </fieldset>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
      <div className="space-y-2">
        <Button type="submit" className="ml-auto block" disabled={false}>
          Guardar pedido
        </Button>
      </div>
    </form>
  );
}
