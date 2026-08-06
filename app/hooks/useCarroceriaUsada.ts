import { useForm } from "react-hook-form";
import { useModal } from "~/context/ModalContext";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import type { Pedido } from "~/types/pedido";
import { usePedido } from "~/context/PedidoContext";
export const useCarroceriaUsada = () => {
  const { setMessageForm, setStepForm, openModal } = useModal();
  const form = useForm<CarroceriaUsadaData>({
    defaultValues: {},
  });
  const {
    updateCarroceriaUsadaBase,
    createNewCarroceriaUsada,
    changeStatusCarroceriaUsada,
  } = useCarroceriasUsadas();
  const { updatePedidoBase } = usePedido();
  const onCreate = async (data: CarroceriaUsadaData) => {
    try {
      const result = await createNewCarroceriaUsada(data);
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.data && data.pedido_id) {
        // Actualizar el pedido con el ID del préstamo
        const payload = {
          id: data.pedido_id,
          carroceria_usada_id: result.data.id,
        };
        const { error: errorPedido } = await updatePedidoBase(
          payload as Pedido,
          {
            carroceria_usada_id: true,
          },
        );
        if (errorPedido) {
          throw new Error(errorPedido);
        }
      }
      setMessageForm(result.message || "Carrocería usada creada exitosamente");
      setStepForm("success");
      return result.data;
    } catch (error) {
      setMessageForm(
        (error as Error).message || "Error al crear la carrocería usada",
      );
      setStepForm("error");
      return;
    }
  };
  const onUpdate = async (data: CarroceriaUsadaData) => {
    try {
      const result = await updateCarroceriaUsadaBase(
        data as CarroceriaUsadaData,
        form.formState.dirtyFields,
      );
      if (result.error) {
        throw new Error(result.error);
      }
      setMessageForm(
        result.message || "Préstamo de carrocería actualizado exitosamente",
      );
      setStepForm("success");
    } catch (error) {
      setMessageForm(
        (error as Error).message ||
          "Error al actualizar el préstamo de carrocería",
      );
      setStepForm("error");
      return;
    }
  };
  return {
    form,
    onCreate,
    onUpdate,
  };
};
