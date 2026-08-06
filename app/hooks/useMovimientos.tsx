import { useForm, useFieldArray } from "react-hook-form";
import type { FileTypeActions } from "~/components/FileInputComponent";
import { useAdministracion } from "~/context/AdministracionContext";
import { useModal } from "~/context/ModalContext";
import type {
  MovimientoFormValues,
  MovimientoDetalle,
  Documento,
} from "~/types/cuentas-corrientes";
export const useMovimientos = () => {
  const {
    createMovimiento,
    updateMovimientoAndDocumentos,
    isCHEQUERegistered,
  } = useAdministracion();
  const { setMessageForm, setStepForm } = useModal();
  const form = useForm<MovimientoFormValues>({
    defaultValues: {
      cliente_id: "",
      fecha_movimiento: new Date().toISOString().split("T")[0],
      tipo_movimiento: "",
      origen: "manual",
      medio_pago: "",
      debe: undefined,
      haber: undefined,
      cheques: [],
      documentos: [],
    },
  });
  const fieldArrayCheques = useFieldArray({
    control: form.control,
    name: "cheques",
  });
  const fieldArrayDocumentos = useFieldArray({
    control: form.control,
    name: "documentos",
  });
  const onCreate = async (
    data: MovimientoFormValues,
    files: FileList | null,
  ) => {
    if (data.origen === "cheque") {
      const chequeNumbers = data.cheques.map((c) => c.numero);
      const hasDuplicateCheques = chequeNumbers.some(
        (num, idx) => chequeNumbers.indexOf(num) !== idx,
      );
      if (hasDuplicateCheques) {
        setMessageForm("Error: Cheques duplicados");
        setStepForm("error");
        return;
      }
      if (chequeNumbers.some((num) => num === undefined)) {
        setMessageForm("Error: Número de cheque inválido");
        setStepForm("error");
        return;
      }
      const isRegistered = chequeNumbers.some((num) => isCHEQUERegistered(num as number, data.cliente_id));
      if (isRegistered) {
        setMessageForm("Error: Cheque ya registrado");
        setStepForm("error");
        return;
      }
    }
    const result = await createMovimiento(data as MovimientoDetalle, files);
    if (!result.success) {
      setMessageForm(result.message || "Error al crear el movimiento");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Movimiento creado exitosamente");
    setStepForm("success");
    return result.data;
  };
  const onUpdate = async (
    data: MovimientoFormValues,
    files: FileTypeActions<Documento>,
  ) => {
    const result = await updateMovimientoAndDocumentos(
      data as MovimientoDetalle,
      form.formState.dirtyFields,
      files,
    );
    if (!result.success) {
      setMessageForm(result.message || "Error al actualizar el movimiento");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Movimiento actualizado exitosamente");
    setStepForm("success");
  };
  return { form, fieldArrayCheques, fieldArrayDocumentos, onCreate, onUpdate };
};
