import { useForm } from "react-hook-form";
import { useRRHH } from "~/context/RRHHContext";
import { useModal } from "~/context/ModalContext";
import type { MvtoEmpleados, MvtoEmpleadosFormValues } from "~/types/rrhh";
export const useMvtoEmpleado = () => {
  const { setMessageForm, setStepForm, openModal } = useModal();
  const form = useForm<MvtoEmpleadosFormValues>({
    defaultValues: {},
  });
  const {
    createNewMvtoEmpleado,
    updateMvtoEmpleado,
    removeMvtoEmpleado,
    reactivateMvtoEmpleado
  } = useRRHH();
  const onCreate = async (data: MvtoEmpleadosFormValues) => {
    
    const result = await createNewMvtoEmpleado(data as Omit<MvtoEmpleados, "id">);
    if (!result.success) {
      setMessageForm(result.message || "Error al crear el empleado");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Empleado creado exitosamente");
    setStepForm("success");
    return result.data;
  };
  const onUpdate = async (data: MvtoEmpleadosFormValues) => {
    const result = await updateMvtoEmpleado(
      data as MvtoEmpleados,
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
    const result = await removeMvtoEmpleado(employeeId);
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
    const result = await reactivateMvtoEmpleado(employeeId);
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
