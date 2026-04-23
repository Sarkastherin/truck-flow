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
  InputNumberIcon,
  Select,
  Textarea,
  ToggleSwitch,
} from "~/components/InputsForm";
import type {
  CarroceriaFormValues,
  Carroceria,
  Documentos,
  PedidoFormValues,
  CarroceriaUsadaFormValues,
  CarroceriaUsada,
} from "~/types/pedido";
import {
  materialOptions,
  espesorOptions,
  anchoOptions,
  arcosOptions,
  lineasRefOptions,
  pisoOptions,
  tiposArcosOptions,
  zocaloOptions,
} from "~/types/pedido";
import { useModal } from "~/context/ModalContext";
import { useEffect, useMemo, useState } from "react";
import { LuRuler } from "react-icons/lu";
import { BsCalendar2Week } from "react-icons/bs";
import {
  FileInputComponent,
  type FileTypeActions,
} from "~/components/FileInputComponent";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import AccesoriosForm from "./AccesoriosForm";
import AlarguesForm from "./AlarguesForm";
import { usePedido } from "~/context/PedidoContext";
import { useFormNavigationBlock } from "~/hooks/useFormNavigationBlock";
import { MODE_DEV } from "~/backend/Database/SheetsConfig";
import CuchetinForm from "./CuchetinForm";
export default function CarroceriaUsadaForm({
  pedido,
}: {
  pedido: PedidoFormValues;
}) {
  type FormValues = CarroceriaUsadaFormValues & {
    documentos: Documentos[];
  };
  const {
    carroceria_usada: carroceria,
    documentos,
    id: idPedido,
    numero_pedido: numeroPedido,
  } = pedido;
  const documentosCarroceria = useMemo(
    () =>
      documentos?.filter((doc) => doc.tipo_documento === "carroceria") ?? [],
    [documentos],
  );
  const {} = usePedido();
  const { openModal, closeModal } = useModal();
  const [files, setFiles] = useState<FileTypeActions<Documentos>>({
    add: null,
    remove: null,
  });
  const defaultValues =
    Object.keys(carroceria || {}).length > 0
      ? {
          ...carroceria,
          documentos: documentosCarroceria,
        }
      : {
          pedido_id: idPedido as string,
          tipo_carrozado_id: "",
          material: "",
          espesor_chapa: undefined,
          largo_int: undefined,
          largo_ext: undefined,
          ancho_ext: undefined,
          alto: undefined,
          alt_baranda: undefined,
          ptas_por_lado: undefined,
          puerta_trasera_id: "",
          arcos_por_puerta: undefined,
          tipos_arcos: "",
          corte_guardabarros: false,
          cumbreras: false,
          lineas_refuerzo: undefined,
          tipo_zocalo: "",
          tipo_piso: "",
          cuchetin: false,
          med_cuchetin: null,
          alt_pta_cuchetin: null,
          alt_techo_cuchetin: null,
          notas_cuchetin: "",
          alargue_tipo_1: "N/A",
          cant_alargue_1: null,
          med_alargue_1: null,
          quiebre_alargue_1: false,
          alargue_tipo_2: "N/A",
          cant_alargue_2: null,
          med_alargue_2: null,
          quiebre_alargue_2: false,
          documentos: documentosCarroceria,
        };
  const { carrozadosOptions, puertasOptions } = useConfiguracion();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields, isDirty, isSubmitSuccessful },
  } = useForm<FormValues>({
    defaultValues: defaultValues as FormValues,
  });

  useEffect(() => {
    setValue("documentos", documentosCarroceria || [], {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [documentosCarroceria, setValue]);

  const isEditMode = Boolean(watch("id"));
  const guardaBarrosEnabled = watch("corte_guardabarros");
  const onSubmit = async (data: FormValues) => {
    openModal("loading", {
      props: {
        title: isEditMode ? "Actualizando pedido..." : "Creando pedido...",
      },
    });
    try {
      if (!isEditMode) {
      } else {
      }
      openModal("success", {
        props: {
          title: isEditMode ? "Carrocería actualizada" : "Carrocería creada",
          message: isEditMode
            ? "La carroceria ha sido actualizada exitosamente."
            : "La carroceria ha sido creada exitosamente.",
        },
      });
      setFiles({
        add: null,
        remove: null,
      });
    } catch (error) {
      console.error("Error en onSubmit de CarroceriaForm:", error);
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Ha ocurrido un error desconocido al guardar la carroceria.",
        },
      });
    }
  };

  const handleChangeArcosField = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedArcos = e.target.value;
    setValue("tipos_arcos", selectedArcos === "0" ? "N/A" : "");
  };

  const handleToggleCuchetinSection = (checked: boolean) => {
    setValue("cuchetin", checked, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!checked) {
      setValue("med_cuchetin", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("alt_pta_cuchetin", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("alt_techo_cuchetin", null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("notas_cuchetin", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const onError = (formErrors: unknown) => {
    console.log("Errores de validación:", formErrors);
  };
  useFormNavigationBlock<PedidoFormValues>({
    isDirty,
    isSubmitSuccessful,
    dirtyFields,
  });
  const newCarrozadoOptions = useMemo(() => {
    return [
      { value: "otro", label: "OTRO" },
      ...carrozadosOptions.map((carrozado) => ({
        value: carrozado.label,
        label: carrozado.label,
      })),
    ];
  }, [carrozadosOptions]);
  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="w-full space-y-6"
    >
      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Datos de la carroceria</AccordionTitle>
          <AccordionContent>
            <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 items-end">
              <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-2 flex gap-2">
                <div className="flex-1">
                  <Select
                    requiredField
                    label="Carrozado"
                    {...register("tipo_carrozado", {
                      required: "Este campo es obligatorio",
                    })}
                    error={errors.tipo_carrozado?.message}
                    options={newCarrozadoOptions}
                  />
                </div>
                <div
                  className="flex-2"
                  hidden={watch("tipo_carrozado") !== "otro"}
                >
                  <Input
                    label="Describa el tipo de carrozado"
                    placeholder="Describa el tipo de carrozado"
                    {...register("tipo_carrozado_otro", {
                      required:
                        watch("tipo_carrozado") === "otro"
                          ? "Este campo es obligatorio"
                          : false,
                    })}
                    error={errors.tipo_carrozado_otro?.message}
                    disabled={watch("tipo_carrozado") !== "otro"}
                  />
                </div>
              </div>
              <Input
                label="Marca"
                {...register("marca")}
                placeholder="Nombre del fabricante"
              />
              <InputNumberIcon
                label="Año de fabricación"
                placeholder="Ingrese un valor"
                {...register("anio_fabricacion")}
                icon={BsCalendar2Week}
              />
              <InputNumberIcon
                label="Largo"
                placeholder="Ingrese un valor"
                {...register("largo")}
                icon={LuRuler}
              />
              <InputNumberIcon
                label="Alto"
                placeholder="Ingrese un valor"
                {...register("alto")}
                icon={LuRuler}
              />
              <Select
                label="Ancho"
                {...register("ancho")}
                options={anchoOptions}
              />
              <InputNumberIcon
                label="Alt. baranda"
                placeholder="Ingrese un valor"
                {...register("alt_baranda")}
                icon={LuRuler}
              />
              <Select
                label="Tipo piso"
                {...register("tipo_piso")}
                options={pisoOptions}
              />
              <Select
                label="Arcos por puerta"
                {...register("arcos_por_puerta")}
                options={arcosOptions}
              />
              <Select
                label="Tipo de arcos"
                {...register("tipos_arcos")}
                disabled={String(watch("arcos_por_puerta")) === "0"}
                options={tiposArcosOptions}
              />
              <div className="md:col-span-3">
                <Input
                  label="Color"
                  placeholder="Describa como esta pintada la carrocería"
                  {...register("color", {
                    required: watch("color")
                      ? "Este campo es obligatorio"
                      : false,
                  })}
                />
              </div>

              <InputNumberIcon
                label="Ptas. por lado"
                placeholder="Ingrese un valor"
                {...register("ptas_por_lado")}
                icon={LuRuler}
              />

              <div className="col-span-1 md:col-span-2 xl:col-span-2">
                <Select
                  label="Puerta trasera"
                  {...register("puerta_trasera_id")}
                  options={puertasOptions}
                />
              </div>
              <div className="flex gap-4 col-span-3 mt-2">
                <ToggleSwitch
                  id="corte_guardabarros"
                  label={`${guardaBarrosEnabled ? "Con corte de guardabarros" : "Sin corte de guardabarros"}`}
                  value={guardaBarrosEnabled}
                  disabled={watch("tipo_zocalo") === "gross_nuevo"}
                  onCustumChange={(checked) =>
                    setValue("corte_guardabarros", checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                <ToggleSwitch
                  id="cumbreras"
                  label="Cumbreras"
                  value={watch("cumbreras")}
                  onCustumChange={(checked) =>
                    setValue("cumbreras", checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </fieldset>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
      <CuchetinForm
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        withAccordion
      />

      <AccesoriosForm
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        withAccordion
        isOptional={true}
      />

      <AlarguesForm
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        withAccordion
      />

      <FileInputComponent
        tipoDocumento="carroceria_usada"
        documentos={watch("documentos")}
        setFiles={setFiles}
        files={files}
      />
      <Textarea
        label="Condición"
        placeholder="Describa la condición general de la carrocería usada, detalles de golpes, reparaciones previas, estado de pintura, etc."
        {...register("notas")}
        error={errors.notas?.message}
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
