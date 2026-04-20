import { Button } from "flowbite-react";
import { Input } from "../InputsForm";
import { SeleccionarSocioModal } from "../modals/customs/SeleccionarSocioModal";
import type { SocioComercial } from "~/types/socios";
import { useModal } from "~/context/ModalContext";
import { LuUserRoundPlus } from "react-icons/lu";
import { useSocio } from "~/hooks/useSocio";
import { SocioModal } from "../modals/customs/SocioModal";
import { capitalize } from "~/utils/functions";

interface SocioComponentFormProps<T> {
  error: string | undefined;
  value: string;
  onSelect: (item: SocioComercial) => void;
  tipoSocio: "cliente" | "proveedor";
}

export function SocioComponentForm<T>({
  error,
  value,
  onSelect,
  tipoSocio
}: SocioComponentFormProps<T>) {
  const { form, onCreate } = useSocio();
  const { openModal, closeModal } = useModal();

  const handleSelectSocio = (item: SocioComercial) => {
    onSelect(item);
    closeModal();
  };

  const handleOpenSocioModal = () => {
    openModal("custom", {
      title: `Seleccionar ${tipoSocio}`,
      component: SeleccionarSocioModal,
      onSelect: handleSelectSocio,
      tipoSocio
    });
  };

  const handleCreateSocio = async (data: Parameters<typeof onCreate>[0]) => {
    const newSocio = await onCreate(data);
    if (newSocio) {
      onSelect(newSocio);
    }
  };

  const handleOpenNuevoSocioModal = () => {
    const newForm = form;
    newForm.reset({
      razon_social: "",
      cuit_cuil: "",
      direccion: "",
      telefono_contacto: "",
      email_contacto: "",
      nombre_contacto: "",
      tipo: tipoSocio,
      provincia_id: "",
      provincia: "",
      localidad_id: "",
      localidad: "",
      condicion_iva: "",
      vendedor_id: "",
    });
    newForm.clearErrors();
    openModal("form", {
      component: SocioModal,
      props: {
        form: newForm,
        title: `Nuevo ${tipoSocio}`,
        size: "2xl",
        tipoSocio,
      },
      onSubmit: newForm.handleSubmit(handleCreateSocio),
    });
  };
  return (
    <div className="flex gap-1 items-end">
      <Input
        label={capitalize(tipoSocio)}
        type="text"
        placeholder={`Seleccione un ${tipoSocio}`}
        readOnly
        onClick={handleOpenSocioModal}
        value={value}
        requiredField={true}
        error={error}
      />
      <Button
        className="px-3 py-5"
        color="alternative"
        onClick={handleOpenNuevoSocioModal}
      >
        <LuUserRoundPlus className="size-4.5 text-gray-500" />
      </Button>
    </div>
  );
}
