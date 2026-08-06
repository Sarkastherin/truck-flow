import type { Route } from "../+types/home";
import { useOutletContext } from "react-router";
import type { PedidoFormValues, CarroceriaUsada } from "~/types/pedido";
import { LoadingComponent } from "~/components/LoadingComponent";
import { Button } from "flowbite-react";
import { SeleccionarCarroceriaModal } from "~/components/modals/customs/SeleccionarCarroceriaModal";
import { useModal } from "~/context/ModalContext";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import { usePedido } from "~/context/PedidoContext";
import { useUser } from "~/context/UserContext";
import CardCarroceriaUsadaAsigned from "~/components/specials/CardCarroceriaUsadaAsigned";
import { Textarea } from "~/components/InputsForm";
import { useForm } from "react-hook-form";
import type { CommonTypes } from "~/types/commonTypes";
import ModificarLargueroForm from "~/forms/ModificarLargueroForm";
import ModificarColorForm from "~/forms/ModificarColorForm";
import AccesoriosUsadosForm from "~/forms/AccesoriosUsadosForm";
import AlarguesForm from "~/forms/AlarguesForm";
import InfoFieldsComponent from "~/components/InfoFieldsComponent";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Editar Carrocería Usada" },
    {
      name: "description",
      content: "Edita los detalles de la carrocería usada",
    },
  ];
}
type FormValues = Omit<CarroceriaUsada, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
};
export default function PedidosCarroceriaUsada() {
  const {
    asignedCarroceriaUsada,
    createCarroceriaUsadaBase,
    updateCarroceriaUsadaBase,
  } = usePedido();
  const { activeUser } = useUser();
  const pedido = useOutletContext<PedidoFormValues>();
  const { carroceria_usada } = pedido;
  const { openModal } = useModal();
  const defaultValues =
    Object.keys(carroceria_usada || {}).length > 0
      ? carroceria_usada
      : {
          pedido_id: pedido.id!,
          cambio_color: false,
          color_carrozado: "",
          color_zocalo: "",
          notas_color: "",
          modificaciones: "",
        };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { dirtyFields, isDirty, isSubmitSuccessful, errors },
  } = useForm<FormValues>({
    defaultValues: defaultValues as FormValues,
  });

  const handleOpenModal = () => {
    openModal("custom", {
      title: "Seleccionar Carrocería Usada",
      component: SeleccionarCarroceriaModal,
      onSelect: (item: CarroceriaUsadaData) => {
        handleSelectCarroceriaUsada(item);
      },
      size: "4xl",
    });
  };
  const handleSelectCarroceriaUsada = async (item: CarroceriaUsadaData) => {
    openModal("loading", {
      props: {
        title: "Actualizando pedido",
        message: "Asignando carrocería usada al pedido, por favor espera.",
      },
    });
    try {
      const response = await asignedCarroceriaUsada(pedido.id!, item.id);
      if (!response.success) {
        throw new Error("Error al actualizar el pedido");
      }
      openModal("success", {
        props: {
          title: "Carrocería usada asignada",
          message:
            "La carrocería usada ha sido asignada al pedido exitosamente.",
        },
      });
    } catch (error) {
      console.error("Error al asignar carrocería usada:", error);
      openModal("error", {
        props: {
          title: "Error",
          message:
            "Hubo un error al asignar la carrocería usada al pedido. Por favor, intenta nuevamente.",
        },
      });
    }
  };
  const isEditMode = Boolean(watch("id"));
  const onSubmit = async (data: FormValues) => {
    openModal("loading", {
      props: {
        title: isEditMode ? "Actualizando pedido..." : "Creando pedido...",
      },
    });

    try {
      if (!isEditMode) {
        const response = await createCarroceriaUsadaBase(
          data as CarroceriaUsada,
        );
        if (!response.success) {
          throw new Error("Error al crear la carrocería usada");
        }
        const now = new Date().toISOString();
        setValue("id", response.data.id);
        setValue("created_at", now);
        setValue("created_by", activeUser?.id || "");
        setValue("updated_at", now);
        setValue("updated_by", activeUser?.id || "");
        openModal("success", {
          props: {
            title: "Carrocería usada creada",
            message: "La carrocería usada ha sido creada exitosamente.",
          },
        });
      } else {
        const response = await updateCarroceriaUsadaBase(
          data as CarroceriaUsada,
          dirtyFields,
        );
        if (!response.success) {
          throw new Error("Error al actualizar la carrocería usada");
        }
        openModal("success", {
          props: {
            title: "Carrocería usada actualizada",
            message: "La carrocería usada ha sido actualizada exitosamente.",
          },
        });
      }
    } catch (error) {
      console.error("Error al guardar el pedido:", error);
      openModal("error", {
        props: {
          title: "Error",
          message:
            "Hubo un error al guardar el pedido. Por favor, intenta nuevamente.",
        },
      });
    }
  };
  if (pedido.id === undefined) {
    return <LoadingComponent />;
  }
  return (
    <section className="ps-4 w-full">
      {pedido.carroceria_usada_id && pedido.carroceria_usada ? (
        <>
          <CardCarroceriaUsadaAsigned pedido={pedido} />
          <form
            className="mt-4 flex flex-col gap-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <ModificarColorForm
              register={register}
              watch={watch}
              setValue={setValue}
              withAccordion={true}
            />
            <ModificarLargueroForm
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              withAccordion={true}
            />
            <AccesoriosUsadosForm
              register={register}
              watch={watch}
              setValue={setValue}
              withAccordion={true}
            />
            <AlarguesForm
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              withAccordion={true}
            />
            <Textarea label="Modificaciones" {...register("modificaciones")} />
            <InfoFieldsComponent
              created_at={getValues("created_at")}
              created_by={getValues("created_by")}
              updated_at={getValues("updated_at")}
              updated_by={getValues("updated_by")}
            />
            <div className="space-y-2 mt-4">
              <Button type="submit" className="ml-auto block" disabled={false}>
                Guardar pedido
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center h-50 gap-4">
          <p className="text-lg text-center text-gray-500 dark:text-gray-400">
            Seleccione un carrocería usada para este pedido.
          </p>
          <Button onClick={handleOpenModal}>
            Seleccionar carrocería usada
          </Button>
        </div>
      )}
    </section>
  );
}
