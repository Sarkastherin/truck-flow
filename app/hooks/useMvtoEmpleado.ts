import { useFieldArray, useForm } from "react-hook-form";
import { useRRHH } from "~/context/RRHHContext";
import { useModal } from "~/context/ModalContext";
import type {
  MvtoEmpleadoRowFormValues,
  MvtoEmpleadosFormValues,
  MvtoEmpleadosPayload,
} from "~/types/rrhh";
export const useMvtoEmpleado = () => {
  const { setMessageForm, setStepForm } = useModal();
  const form = useForm<MvtoEmpleadosFormValues>({
    defaultValues: {
      empleado_id: "",
      tipo_movimiento: "deuda",
      movimientos: [],
      eliminados: [],
    },
  });
  const fieldArray = useFieldArray({
    control: form.control,
    name: "movimientos",
  });
  const {
    CUDMvtoEmpleados,
    removeMvtoEmpleado,
    reactivateMvtoEmpleado,
  } = useRRHH();
  const buildPayload = (
    data: MvtoEmpleadosFormValues,
    row: MvtoEmpleadoRowFormValues,
  ): MvtoEmpleadosPayload => {
    const payload: MvtoEmpleadosPayload = {
      empleado_id: data.empleado_id,
      tipo_movimiento: data.tipo_movimiento,
      fecha_movimiento: row.fecha_movimiento,
      concepto: row.concepto,
      debe: data.tipo_movimiento === "deuda" ? Number(row.importe) || 0 : 0,
      haber: data.tipo_movimiento === "pago" ? Number(row.importe) || 0 : 0,
    };
    if (row.id) payload.id = row.id;
    if (data.liquidacion_id) payload.liquidacion_id = data.liquidacion_id;
    return payload;
  };
  const onCreate = async (data: MvtoEmpleadosFormValues) => {
    if (data.movimientos.length === 0) {
      setMessageForm("Agregá al menos un movimiento antes de guardar");
      setStepForm("error");
      return;
    }
    const payload = data.movimientos.map((row) => buildPayload(data, row));
    const result = await CUDMvtoEmpleados(payload, []);
    if (!result.success) {
      setMessageForm(result.message || "Error al guardar los movimientos");
      setStepForm("error");
      return;
    }
    setMessageForm(
      result.message ||
        `${payload.length} movimiento${payload.length === 1 ? "" : "s"} guardado${payload.length === 1 ? "" : "s"} exitosamente`,
    );
    setStepForm("success");
    return result;
  };
  const onUpdate = async (data: MvtoEmpleadosFormValues) => {
    const eliminados = data.eliminados ?? [];
    if (data.movimientos.length === 0 && eliminados.length === 0) {
      setMessageForm("No hay movimientos para guardar");
      setStepForm("error");
      return;
    }
    const payload = data.movimientos.map((row) => buildPayload(data, row));
    const result = await CUDMvtoEmpleados(payload, eliminados);
    if (!result.success) {
      setMessageForm(result.message || "Error al actualizar el movimiento");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Movimiento actualizado exitosamente");
    setStepForm("success");
    return result;
  };
  const onDelete = async (employeeId: string) => {
    const result = await removeMvtoEmpleado(employeeId);
    if (!result.success) {
      setMessageForm(result.message || "Error al eliminar el movimiento");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Movimiento eliminado exitosamente");
    setStepForm("success");
    return result;
  };
  const onReactivate = async (employeeId: string) => {
    const result = await reactivateMvtoEmpleado(employeeId);
    if (!result.success) {
      setMessageForm(result.message || "Error al reactivar el movimiento");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Movimiento reactivado exitosamente");
    setStepForm("success");
    return result;
  };
  return {
    form,
    fieldArray,
    onCreate,
    onUpdate,
    onDelete,
    onReactivate,
  };
};
