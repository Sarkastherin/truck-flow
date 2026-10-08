import { useForm } from "react-hook-form";
import { useRRHH } from "~/context/RRHHContext";
import { useModal } from "~/context/ModalContext";
import type { Premios, PremiosFormValues } from "~/types/rrhh";
export const usePremios = () => {
  const { setMessageForm, setStepForm, openModal } = useModal();
  const form = useForm<PremiosFormValues>({
    defaultValues: {},
  });
  const {
    createNewPremios,
    updatePremios,
    removePremios,
    reactivatePremios
  } = useRRHH();
  const onCreate = async (data: PremiosFormValues) => {
    
    const result = await createNewPremios(data as Omit<Premios, "id">);
    if (!result.success) {
      setMessageForm(result.message || "Error al crear el empleado");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Empleado creado exitosamente");
    setStepForm("success");
    return result.data;
  };
  const onUpdate = async (data: PremiosFormValues) => {
    const result = await updatePremios(
      data as Premios,
      form.formState.dirtyFields,
    );
    if (!result.success) {
      setMessageForm(
        result.message || "Error al actualizar el empleado",
      );
      setStepForm("error");
      return;
    }
    setMessageForm(
      result.message || "Empleado actualizado exitosamente",
    );
    setStepForm("success");
    return result;
  };
  const onDelete = async (employeeId: string) => {
    const result = await removePremios(employeeId);
    if (!result.success) {
      setMessageForm(result.message || "Error al eliminar el empleado");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Empleado eliminado exitosamente");
    setStepForm("success");
    return result;
  };
  const onReactivate = async (employeeId: string) => {
    const result = await reactivatePremios(employeeId);
    if (!result.success) {
      setMessageForm(result.message || "Error al reactivar el empleado");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Empleado reactivado exitosamente");
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
