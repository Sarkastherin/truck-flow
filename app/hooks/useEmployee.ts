import { useForm } from "react-hook-form";
import { useRRHH } from "~/context/RRHHContext";
import { useModal } from "~/context/ModalContext";
import type { Employee, EmployeeFormValues } from "~/types/rrhh";
export const useEmployee = () => {
  const { setMessageForm, setStepForm, openModal } = useModal();
  const form = useForm<EmployeeFormValues>({
    defaultValues: {},
  });
  const {
    createNewEmployee,
    updateEmployee,
    removeEmployee,
    reactivateEmployee,
    isDNIRegistered
  } = useRRHH();
  const onCreate = async (data: EmployeeFormValues) => {
    const duplicatedDNI = isDNIRegistered(data.dni);
    if (duplicatedDNI) {
      setMessageForm(
        "El DNI ingresado ya está registrado",
      );
      setStepForm("error");
      return;
    }
    const result = await createNewEmployee(data as Omit<Employee, "id">);
    if (!result.success) {
      setMessageForm(result.message || "Error al crear el empleado");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Empleado creado exitosamente");
    setStepForm("success");
    return result.data;
  };
  const onUpdate = async (data: EmployeeFormValues) => {
    const result = await updateEmployee(
      data as Employee,
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
    const result = await removeEmployee(employeeId);
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
    const result = await reactivateEmployee(employeeId);
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
