import { useForm } from "react-hook-form";
import type { SocioComercial, SocioComercialFormValues } from "~/types/socios";
import { useSociosComercial } from "~/context/SociosComercialesContext";
import { useModal } from "~/context/ModalContext";
import { SocioModal } from "~/components/modals/customs/SocioModal";
import type { UsersTable } from "~/types/users";
import { useUser } from "~/context/UserContext";
import type { CommonTypes } from "~/types/commonTypes";
type FormValues = Omit<UsersTable, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};
export const useUsuario = () => {
  const { setMessageForm, setStepForm, openModal } = useModal();
  const form = useForm<FormValues>({
    defaultValues: {},
  });
  const { createUser, updateUser, deleteUser, reactivateUser } = useUser();
  const onCreate = async (data: FormValues) => {
    const result = await createUser(data as Omit<UsersTable, "id">);
    if (!result.success) {
      setMessageForm(result.message || "Error al crear nuevo usuario");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Usuario creado exitosamente");
    setStepForm("success");
    return result.data;
  };
  const onUpdate = async (data: FormValues) => {
    const result = await updateUser(
      data as UsersTable,
      form.formState.dirtyFields,
    );
    if (!result.success) {
      setMessageForm(
        result.message || "Error al actualizar el usuario",
      );
      setStepForm("error");
      return;
    }
    setMessageForm(
      result.message || "Usuario actualizado exitosamente",
    );
    setStepForm("success");
    return result;
  };
  const onDelete = async (userId: string) => {
    const result = await deleteUser(userId);
    if (!result.success) {
      setMessageForm(result.message || "Error al eliminar el usuario");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Usuario eliminado exitosamente");
    setStepForm("success");
    return result;
  };
  const onReactivate = async (userId: string) => {
    const result = await reactivateUser(userId);
    if (!result.success) {
      setMessageForm(result.message || "Error al reactivar el usuario");
      setStepForm("error");
      return;
    }
    setMessageForm(result.message || "Usuario reactivado exitosamente");
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
