import { useForm } from "react-hook-form";
import { useRRHH } from "~/context/RRHHContext";
import { useModal } from "~/context/ModalContext";
import type { Liquidacion, LiquidacionFormValues } from "~/types/liquidaciones";
export const useLiquidacion = (
) => {
  const { setMessageForm, setStepForm, openModal } = useModal();
  const form = useForm<LiquidacionFormValues>({
    defaultValues: {},
  });
  const {
    createNewLiquidacion,
    updateLiquidacion,
    removeLiquidacion,
    reactivateLiquidacion,
  } = useRRHH();
  const onCreate = async (data: LiquidacionFormValues) => {
    try {
      const result = await createNewLiquidacion(
        data as Omit<Liquidacion, "id">,
      );
      if (!result.success) {
        throw new Error(result.message || "Error al crear el liquidacion");
      }
      setMessageForm(result.message || "Liquidación creado exitosamente");
      setStepForm("success");
      return result.data;
    } catch (error: any) {
      setMessageForm(error || "Error al crear el liquidacion");
      setStepForm("error");
    }
  };
  const onUpdate = async (data: LiquidacionFormValues) => {
    const result = await updateLiquidacion(
      data as Liquidacion,
      form.formState.dirtyFields,
    );
    if (!result.success) {
      setMessageForm(result.message || "Error al actualizar el liquidacion");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Liquidación actualizado exitosamente");
    setStepForm("success");
    return result;
  };
  const onDelete = async (employeeId: string) => {
    const result = await removeLiquidacion(employeeId);
    if (!result.success) {
      setMessageForm(result.message || "Error al eliminar el liquidacion");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Liquidación eliminado exitosamente");
    setStepForm("success");
    return result;
  };
  const onReactivate = async (employeeId: string) => {
    const result = await reactivateLiquidacion(employeeId);
    if (!result.success) {
      setMessageForm(result.message || "Error al reactivar el liquidacion");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Liquidación reactivado exitosamente");
    setStepForm("success");
    return result;
  };
  return {
    form,
    onCreate,
    onUpdate,
    onDelete,
    onReactivate,
  };
};
