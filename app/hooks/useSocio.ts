import { useForm } from "react-hook-form";
import type { SocioComercial, SocioComercialFormValues } from "~/types/socios";
import { useSociosComercial } from "~/context/SociosComercialesContext";
import { useModal } from "~/context/ModalContext";
export const useSocio = () => {
  const { setMessageForm, setStepForm } = useModal();
  const form = useForm<SocioComercialFormValues>({
    defaultValues: {},
  });
  const {
    createNewSocio,
    updateSocio,
    removeSocio,
    reactivateSocio,
    isCUITRegistered,
  } = useSociosComercial();
  const onCreate = async (data: SocioComercialFormValues) => {
    const duplicatedCUIT = isCUITRegistered(data.cuit_cuil, data.tipo);
    if (duplicatedCUIT) {
      setMessageForm(
        "El CUIT/CUIL ingresado ya está registrado para ese tipo de socio comercial",
      );
      setStepForm("error");
      return;
    }
    const result = await createNewSocio(data as Omit<SocioComercial, "id">);
    if (!result.success) {
      setMessageForm(result.message || "Error al crear el socio comercial");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Socio comercial creado exitosamente");
    setStepForm("success");
    return result.data;
  };
  const onUpdate = async (data: SocioComercialFormValues) => {
    const result = await updateSocio(
      data as SocioComercial,
      form.formState.dirtyFields,
    );
    if (!result.success) {
      setMessageForm(
        result.message || "Error al actualizar el socio comercial",
      );
      setStepForm("error");
      return;
    }
    setMessageForm(
      result.message || "Socio comercial actualizado exitosamente",
    );
    setStepForm("success");
    return result;
  };
  const onDelete = async (socioId: string) => {
    const result = await removeSocio(socioId);
    if (!result.success) {
      setMessageForm(result.message || "Error al eliminar el socio comercial");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Socio comercial eliminado exitosamente");
    setStepForm("success");
    return result;
  };
  const onReactivate = async (socioId: string) => {
    const result = await reactivateSocio(socioId);
    if (!result.success) {
      setMessageForm(result.message || "Error al reactivar el socio comercial");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Socio comercial reactivado exitosamente");
    setStepForm("success");
    return result;
  };
  return { form, onCreate, onUpdate, onDelete, onReactivate };
};
