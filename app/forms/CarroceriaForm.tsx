import { useForm } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
  Button,
} from "flowbite-react";
import {
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
import {
  FileInputComponent,
  type FileTypeActions,
} from "~/components/FileInputComponent";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import AccesoriosForm from "./AccesoriosForm";
import AlarguesForm from "./AlarguesForm";
import { usePedido } from "~/context/PedidoContext";
import { useFormNavigationBlock } from "~/hooks/useFormNavigationBlock";
import CuchetinForm from "./CuchetinForm";
const modeDev = import.meta.env.MODE === "development";
export default function CarroceriaForm({
  pedido,
}: {
  pedido: PedidoFormValues;
}) {
  type FormValues = CarroceriaFormValues & {
    documentos: Documentos[];
  };
  const {
    carroceria,
    documentos,
    id: idPedido,
    numero_pedido: numeroPedido,
  } = pedido;
  const documentosCarroceria = useMemo(
    () =>
      documentos?.filter((doc) => doc.tipo_documento === "carroceria") ?? [],
    [documentos],
  );
  const { createNewCarroceria, updateCarroceria } = usePedido();
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
    valoresPredefinidos,
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
  const guardaBarrosEnabled = watch("corte_guardabarros");
  const onSubmit = async (data: FormValues) => {
    openModal("loading", {
      props: {
        title: isEditMode ? "Actualizando pedido..." : "Creando pedido...",
      },
    });
    try {
      if (!isEditMode) {
        const { error } = await createNewCarroceria(
          data as Carroceria & { documentos: Documentos[] },
          idPedido as string,
          numeroPedido as string,
          files,
        );
        if (error) {
          throw new Error(`Error al crear la carroceria: ${error}`);
        }
      } else {
        console.log("Datos a actualizar:", data.corte_guardabarros);
        console.log("Campos modificados:", dirtyFields);
        const { error } = await updateCarroceria(
          data as Carroceria & { documentos: Documentos[] },
          dirtyFields,
          idPedido as string,
          numeroPedido as string,
          files,
        );
        if (error) {
          throw new Error(`Error al actualizar la carroceria: ${error}`);
        }
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

  const handleCarrozadoDefault = (id: string) => {
    const valoresRelacionados = valoresPredefinidos.filter(
      (vp) => vp.carrozado_id === id,
    );
    if (valoresRelacionados.length === 0) return;
    openModal("loading", "Cargando datos del carrozado...");
    for (const item of valoresRelacionados) {
      const { atributo, valor, tipo } = item;
      setValue(atributo as any, valor);
      const elements = document.getElementsByName(atributo);
      elements.forEach((el) => {
        (el as HTMLInputElement | HTMLSelectElement).disabled = tipo === "fijo";
      });
    }
    closeModal();
  };

  const handleChangeMaterialField = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedMaterial = e.target.value;
    if (selectedMaterial === "fibra") {
      setValue("espesor_chapa", "0");
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
  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="w-full space-y-6"
    >
      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Detalle de carroceria</AccordionTitle>
          <AccordionContent>
            <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 items-end">
              <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-2">
                <Select
                  requiredField
                  label="Carrozado"
                  {...register("tipo_carrozado_id", {
                    required: "Este campo es obligatorio",
                    onChange: (e) => {
                      handleCarrozadoDefault(e.target.value);
                    },
                  })}
                  error={errors.tipo_carrozado_id?.message}
                  options={carrozadosOptions}
                />
              </div>
              <Select
                label="Material"
                {...register("material", {
                  required: "Este campo es obligatorio",
                  onChange: handleChangeMaterialField,
                })}
                requiredField
                error={errors.material?.message}
                options={materialOptions}
              />
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
                label="Largo int"
                placeholder="Ingrese un valor"
                {...register("largo_int", {
                  required: "Este campo es obligatorio",
                })}
                icon={LuRuler}
                error={errors.largo_int?.message}
                requiredField
              />
              <InputNumberIcon
                label="Largo ext"
                placeholder="Ingrese un valor"
                {...register("largo_ext", {
                  required: "Este campo es obligatorio",
                })}
                icon={LuRuler}
                requiredField
                error={errors.largo_ext?.message}
              />
              <Select
                label="Ancho externo"
                {...register("ancho_ext", {
                  required: "Este campo es obligatorio",
                  valueAsNumber: true,
                })}
                requiredField
                error={errors.ancho_ext?.message}
                options={anchoOptions}
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
              <Select
                label="Tipo piso"
                {...register("tipo_piso", {
                  required: "Este campo es obligatorio",
                })}
                requiredField
                error={errors.tipo_piso?.message}
                options={pisoOptions}
              />
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

      <CuchetinForm
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        withAccordion
      />

      {modeDev && (
        <AccesoriosForm
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          withAccordion
        />
      )}

      {modeDev && (
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
