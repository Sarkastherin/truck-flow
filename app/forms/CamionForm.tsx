import { useForm } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
  Button,
} from "flowbite-react";
import {
  Input,
  InputGroupWithIcon,
  InputNumberIcon,
  Select,
  Textarea,
} from "~/components/InputsForm";
import type {
  Camion,
  CamionFormValues,
  Documentos,
  PedidoFormValues,
} from "~/types/pedido";
import { useModal } from "~/context/ModalContext";
import { useEffect, useMemo, useState } from "react";
import { LuRuler } from "react-icons/lu";
import {
  FileInputComponent,
  type FileTypeActions,
} from "~/components/FileInputComponent";
import { usePedido } from "~/context/PedidoContext";
import { useFormNavigationBlock } from "~/hooks/useFormNavigationBlock";
export default function CamionForm({ pedido }: { pedido: PedidoFormValues }) {
  type FormValues = CamionFormValues & {
    documentos: Documentos[];
  };
  const {
    camion,
    documentos,
    id: idPedido,
    numero_pedido: numeroPedido,
  } = pedido;
  const documentosCamion = useMemo(
    () => documentos?.filter((doc) => doc.tipo_documento === "camion") ?? [],
    [documentos],
  );
  const { createNewCamion, updateCamion } = usePedido();
  const { openModal } = useModal();
  const [files, setFiles] = useState<FileTypeActions<Documentos>>({
    add: null,
    remove: null,
  });
  const defaultValues =
    Object.keys(camion || {}).length > 0
      ? {
          ...camion,
          documentos: documentosCamion,
        }
      : {
          pedido_id: idPedido as string,
          patente: "",
          marca: "",
          modelo: "",
          tipo_larguero: "",
          med_larguero: undefined,
          centro_eje: undefined,
          voladizo_trasero: undefined,
          notas: "",
          contacto_telefono: "",
          contacto_nombre: "",
          documentos: documentosCamion,
        };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields, isDirty, isSubmitSuccessful },
  } = useForm<FormValues>({
    defaultValues: defaultValues,
  });

  useEffect(() => {
    setValue("documentos", documentosCamion, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [documentosCamion, setValue]);

  const isEditMode = Boolean(watch("id"));
  const onSubmit = async (data: FormValues) => {
    openModal("loading", {
      props: {
        title: isEditMode ? "Actualizando pedido..." : "Creando pedido...",
      },
    });
    try {
      if (!isEditMode) {
        const { error } = await createNewCamion(
          data as Camion & { documentos: Documentos[] },
          idPedido as string,
          numeroPedido as string,
          files,
        );
        if (error) {
          throw new Error(`Error al crear el camión: ${error}`);
        }
      } else {
        const { error } = await updateCamion(
          data as Camion & { documentos: Documentos[] },
          dirtyFields,
          idPedido as string,
          numeroPedido as string,
          files,
        );
        if (error) {
          throw new Error(`Error al actualizar el camión: ${error}`);
        }
      }
      openModal("success", {
        props: {
          title: isEditMode ? "Camión actualizado" : "Camión creado",
          message: isEditMode
            ? "El camión ha sido actualizado exitosamente."
            : "El camión ha sido creado exitosamente.",
        },
      });
      setFiles({
        add: null,
        remove: null,
      });
    } catch (error) {
      console.error("Error en onSubmit de CamionForm:", error);
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Ha ocurrido un error desconocido al guardar el pedido.",
        },
      });
    }
  };
  useFormNavigationBlock<PedidoFormValues>({
    isDirty,
    isSubmitSuccessful,
    dirtyFields,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Datos del camión</AccordionTitle>
          <AccordionContent>
            <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <Select
                label="Marca"
                {...register("marca", {
                  required: "Este campo es obligatorio",
                })}
                error={errors.marca?.message}
                requiredField={true}
                options={[
                  { value: "scania", label: "Scania" },
                  { value: "ford", label: "Ford" },
                  { value: "volvo", label: "Volvo" },
                  { value: "mercedes benz", label: "Mercedes Benz" },
                  { value: "iveco", label: "Iveco" },
                  { value: "volkswagen", label: "Volkswagen" },
                  { value: "otros", label: "Otros" },
                ]}
              />
              <Input
                label="Modelo"
                placeholder="Ingrese el modelo"
                {...register("modelo", {
                  required: "Este campo es obligatorio",
                })}
                error={errors.modelo?.message}
                requiredField={true}
              />
              <Input label="Patente" {...register("patente")} />
              <Select
                label="Larguero"
                {...register("tipo_larguero", {
                  required: "Este campo es obligatorio",
                })}
                requiredField={true}
                error={errors.tipo_larguero?.message}
                options={[
                  { value: "recto", label: "Recto" },
                  { value: "curvo", label: "Curvo" },
                ]}
              />
              <InputGroupWithIcon
                type="text"
                placeholder="Ingrese un valor"
                label="Med Larguero (mm)"
                {...register("med_larguero", {
                  required: "Este campo es obligatorio",
                })}
                requiredField={true}
                icon={LuRuler}
                error={errors.med_larguero?.message}
              />
              <InputNumberIcon
                placeholder="Ingrese un valor"
                label="Centro de Eje (mm)"
                {...register("centro_eje", {
                  required: "Este campo es obligatorio",
                })}
                icon={LuRuler}
                requiredField={true}
                error={errors.centro_eje?.message}
              />
              <InputNumberIcon
                placeholder="Ingrese un valor"
                label="Voladizo Trasero (mm)"
                {...register("voladizo_trasero")}
                icon={LuRuler}
              />
            </fieldset>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
      {watch("marca") === "scania" && (
        <div className="font-bold p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded dark:bg-yellow-200 dark:border-yellow-400 dark:text-yellow-900">
          ⚠️ SCANIA V4x2 – Atención: Requiere modificación de escaleras del lado
          acompañante por interferencia con el tanque.
        </div>
      )}
      <FileInputComponent
        tipoDocumento="camion"
        documentos={watch("documentos")}
        setFiles={setFiles}
        files={files}
      />
      <Textarea
        label="Observaciones"
        placeholder="Observaciones adicionales sobre el pedido"
        {...register("notas")}
        error={errors.notas?.message}
      />
      <div className="space-y-2">
        <Button type="submit" className="ml-auto block" disabled={false}>
          Guardar pedido
        </Button>
      </div>
    </form>
  );
}
