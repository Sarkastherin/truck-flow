import { useForm } from "react-hook-form";
import { useModal } from "~/context/ModalContext";
import type { PrestamoCarroceria } from "~/types/carroceria-usada";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { usePedido } from "~/context/PedidoContext";
import type { Pedido } from "~/types/pedido";
export const usePrestamo = () => {
  const { updatePedidoBase } = usePedido();
  const { setMessageForm, setStepForm, openModal } = useModal();
  const form = useForm<PrestamoCarroceria>({
    defaultValues: {},
  });
  const {
    createPrestamoBase,
    updatePrestamoBase,
    changeStatusCarroceriaUsada,
  } = useCarroceriasUsadas();
  const onCreate = async (data: PrestamoCarroceria) => {
    try {
      const result = await createPrestamoBase(data);
      if (result.error) {
        throw new Error(result.error);
      }
      const { error: errorCarroceriaUsada } = await changeStatusCarroceriaUsada(
        data.carroceria_usada_id,
        "prestada",
      );
      if (errorCarroceriaUsada) {
        throw new Error(errorCarroceriaUsada);
      }
      if (result.data && data.pedido_id) {
        // Actualizar el pedido con el ID del préstamo
        const payload = {
          id: data.pedido_id,
          prestamo_id: result.data.id,
        };
        const { error: errorPedido } = await updatePedidoBase(
          payload as Pedido,
          {
            prestamo_id: true,
          },
        );
        if (errorPedido) {
          throw new Error(errorPedido);
        }
      }
      setMessageForm(
        result.message || "Préstamo de carrocería creado exitosamente",
      );
      setStepForm("success");
      return result.data;
    } catch (error) {
      setMessageForm(
        (error as Error).message || "Error al crear el préstamo de carrocería",
      );
      setStepForm("error");
      return;
    }
  };
  const onUpdate = async (data: PrestamoCarroceria) => {
    try {
      const result = await updatePrestamoBase(
        data as PrestamoCarroceria,
        form.formState.dirtyFields,
      );
      if (result.error) {
        throw new Error(result.error);
      }
      if (data.fecha_devolucion) {
        const { error: errorCarroceriaUsada } =
          await changeStatusCarroceriaUsada(
            data.carroceria_usada_id,
            "disponible",
          );
        if (errorCarroceriaUsada) {
          throw new Error(errorCarroceriaUsada);
        }
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
