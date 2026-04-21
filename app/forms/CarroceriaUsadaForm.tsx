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
  const {
    carrozadosOptions,
    puertasOptions,
    coloresEsmalteOptions,
    coloresLonaOptions,
  } = useConfiguracion();

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
  const cuchetinEnabled = watch("cuchetin");

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
              <Input label="Marca" {...register("marca")} placeholder="Nombre del fabricante"/>
              <InputNumberIcon
                label="Año de fabricación"
                placeholder="Ingrese un valor"
                {...register("anio_fabricacion")}
                icon={BsCalendar2Week}
              />
              <InputNumberIcon
                label="Largo"
                placeholder="Ingrese un valor"
                {...register("largo", {
                  required: "Este campo es obligatorio",
                })}
                icon={LuRuler}
                error={errors.largo?.message}
                requiredField
              />
              <InputNumberIcon
                label="Alto"
                placeholder="Ingrese un valor"
                {...register("alto", {
                  required: "Este campo es obligatorio",
                })}
                icon={LuRuler}
                requiredField
                error={errors.alto?.message}
              />
              <Select
                label="Ancho"
                {...register("ancho", {
                  required: "Este campo es obligatorio",
                  valueAsNumber: true,
                })}
                requiredField
                error={errors.ancho?.message}
                options={anchoOptions}
              />
              <InputNumberIcon
                label="Alt. baranda"
                placeholder="Ingrese un valor"
                {...register("alt_baranda", {
                  required: "Este campo es obligatorio",
                })}
                icon={LuRuler}
                requiredField
                error={errors.alt_baranda?.message}
              />
              <Select
                label="Tipo piso"
                {...register("tipo_piso", {
                  required: "Este campo es obligatorio",
                })}
                requiredField
                error={errors.tipo_piso?.message}
                options={pisoOptions}
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
              <Select
                label="Espesor chapa"
                {...register("espesor_chapa", {
                  required: "Este campo es obligatorio",
                })}
                requiredField
                error={errors.espesor_chapa?.message}
                disabled={watch("material") === "fibra"}
                options={espesorOptions}
              />

              <InputNumberIcon
                label="Ptas. por lado"
                placeholder="Ingrese un valor"
                {...register("ptas_por_lado", {
                  required: "Este campo es obligatorio",
                })}
                icon={LuRuler}
                requiredField
                error={errors.ptas_por_lado?.message}
              />
              <Select
                label="Arcos por puerta"
                {...register("arcos_por_puerta", {
                  required: "Este campo es obligatorio",
                  onChange: handleChangeArcosField,
                  valueAsNumber: true,
                })}
                error={errors.arcos_por_puerta?.message}
                requiredField
                options={arcosOptions}
              />
              <Select
                label="Tipo de arcos"
                {...register("tipos_arcos", {
                  required: "Este campo es obligatorio",
                })}
                requiredField
                error={errors.tipos_arcos?.message}
                disabled={String(watch("arcos_por_puerta")) === "0"}
                options={tiposArcosOptions}
              />
              <div className="col-span-1 md:col-span-2 xl:col-span-2">
                <Select
                  label="Puerta trasera"
                  {...register("puerta_trasera_id", {
                    required: "Este campo es obligatorio",
                  })}
                  requiredField
                  error={errors.puerta_trasera_id?.message}
                  options={puertasOptions}
                />
              </div>
              <Select
                label="Líneas de refuerzo"
                {...register("lineas_refuerzo", {
                  required: "Este campo es obligatorio",
                  valueAsNumber: true,
                })}
                requiredField
                error={errors.lineas_refuerzo?.message}
                options={lineasRefOptions}
              />
              <Select
                label="Tipo zócalo"
                {...register("tipo_zocalo", {
                  required: "Este campo es obligatorio",
                  onChange: (e) => {
                    if (e.target.value === "gross_nuevo") {
                      setValue("corte_guardabarros", false, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  },
                })}
                requiredField
                error={errors.tipo_zocalo?.message}
                options={zocaloOptions}
              />

              <div className="flex gap-4 col-span-3 mt-2">
                <ToggleSwitch
                  id="corte_guardabarros"
                  label="Corte guardabarros"
                  value={watch("corte_guardabarros")}
                  disabled={watch("tipo_zocalo") === "gross_nuevo"}
                />
                <ToggleSwitch
                  id="cumbreras"
                  label="Cumbreras"
                  value={watch("cumbreras")}
                />
              </div>
            </fieldset>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Colores</AccordionTitle>
          <AccordionContent>
            <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <Select
                label="Color carrozado"
                {...register("color_carrozado_id", {
                  required: "Este campo es obligatorio",
                })}
                requiredField
                error={errors.color_carrozado_id?.message}
                options={coloresEsmalteOptions}
              />
              <Select
                label="Color zócalo"
                {...register("color_zocalo_id", {
                  required: "Este campo es obligatorio",
                })}
                requiredField
                error={errors.color_zocalo_id?.message}
                options={coloresEsmalteOptions}
              />
              <Select
                label="Color lona"
                {...register("color_lona_id")}
                error={errors.color_lona_id?.message}
                options={coloresLonaOptions}
              />
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <Textarea
                  label="Observaciones del color"
                  placeholder="Agregue notas u observaciones del color adiconales si son necesarias"
                  {...register("notas_color")}
                />
              </div>
            </fieldset>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Cuchetín</AccordionTitle>
          <AccordionContent>
            <fieldset className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-900/40">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Configurar cuchetín
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Activá esta sección solo si la carroceria lleva cuchetín.
                  </p>
                </div>
                <ToggleSwitch
                  id="cuchetin"
                  label={cuchetinEnabled ? "Cuchetín activo" : "Sin cuchetín"}
                  value={cuchetinEnabled}
                  onCustumChange={handleToggleCuchetinSection}
                />
              </div>

              {cuchetinEnabled ? (
                <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-end">
                    <InputNumberIcon
                      label="Medida (mm)"
                      {...register("med_cuchetin", {
                        required: "Este campo es obligatorio",
                        min: {
                          value: 0.1,
                          message: "La medida debe ser mayor a 0",
                        },
                      })}
                      icon={LuRuler}
                      requiredField
                      error={errors.med_cuchetin?.message}
                    />
                    <InputNumberIcon
                      label="Altura puerta (mm)"
                      {...register("alt_pta_cuchetin", {
                        required: "Este campo es obligatorio",
                        min: {
                          value: 0.1,
                          message: "La medida debe ser mayor a 0",
                        },
                      })}
                      icon={LuRuler}
                      requiredField
                      error={errors.alt_pta_cuchetin?.message}
                    />
                    <InputNumberIcon
                      label="Altura techo (mm)"
                      {...register("alt_techo_cuchetin", {
                        required: "Este campo es obligatorio",
                        min: {
                          value: 0.1,
                          message: "La medida debe ser mayor a 0",
                        },
                      })}
                      icon={LuRuler}
                      requiredField
                      error={errors.alt_techo_cuchetin?.message}
                    />
                  </div>
                  <Textarea
                    label="Observaciones cuchetín"
                    placeholder="Agregue notas u observaciones para el cuchetin si son necesarias"
                    {...register("notas_cuchetin")}
                    rows={2}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Esta carroceria no lleva cuchetín. Activá la sección para
                  cargar sus medidas y observaciones.
                </div>
              )}
            </fieldset>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      {MODE_DEV && (
        <AccesoriosForm
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          withAccordion
        />
      )}

      {MODE_DEV && (
        <AlarguesForm
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          withAccordion
        />
      )}

      <FileInputComponent
        tipoDocumento="carroceria"
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
