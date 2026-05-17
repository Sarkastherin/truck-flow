import { set, useForm } from "react-hook-form";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
  Badge,
  Button,
  Card,
} from "flowbite-react";
import {
  Input,
  InputNumberIcon,
  Textarea,
  CurrencyInput,
  ToggleSwitch,
  Select,
} from "~/components/InputsForm";
import { LuRuler, LuBanknote } from "react-icons/lu";
import CuchetinForm from "~/forms/CuchetinForm";
import AlarguesForm from "~/forms/AlarguesForm";
import AccesoriosForm from "~/forms/AccesoriosForm";
import { BsCalendar2Week } from "react-icons/bs";
import { TbDimensions } from "react-icons/tb";
import { SocioComponentForm } from "~/components/specials/SocioComponent";
import type { SocioComercial } from "~/types/socios";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { useModal } from "~/context/ModalContext";
import { useNavigate } from "react-router";
import { capitalize } from "~/utils/functions";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { useFormNavigationBlock } from "~/hooks/useFormNavigationBlock";
import { usePedido } from "~/context/PedidoContext";
import ImageGallery from "react-image-gallery";
import type { GalleryItem } from "react-image-gallery";
import ImageFileComponent from "~/components/ImageFileComponent";
import type { dataToPayload } from "~/components/ImageFileComponent";
import type { Fotos } from "~/types/carroceria-usada";
import { BadgeStatusCarroceriaUsada } from "~/components/specials/Badges";
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
import { useState } from "react";
import { LuRotateCcw } from "react-icons/lu";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import { useSociosComercial } from "~/context/SociosComercialesContext";
type FormValues = Omit<
  CarroceriaUsadaData,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
};

export default function NuevaCarroceriaUsada({ data }: { data?: FormValues }) {
  const { clientes } = useSociosComercial();
  const { createNewCarroceriaUsada, updateCarroceriaUsadaBase, CUDFotos } =
    useCarroceriasUsadas();
  const { getPedidosData } = usePedido();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const { carrozadosOptions, puertasOptions } = useConfiguracion();
  const {
    handleSubmit,
    register,
    watch,
    setValue,
    control,
    formState: { errors, dirtyFields, isDirty, isSubmitSuccessful },
  } = useForm<FormValues>({
    defaultValues: data || {
      duenno: null,
      duenno_id: "",
      fecha_recepcion: "",
      precio_lista: undefined,
      tasacion: undefined,
      marca_carroceria: "",
      status: "disponible",
      tipo_carrozado: "",
      material: "",
      espesor_chapa: undefined,
      largo: undefined,
      ancho: undefined,
      alto: undefined,
      alt_baranda: undefined,
      ptas_por_lado: undefined,
      arcos_por_puerta: "",
      tipos_arcos: "",
      puerta_trasera: "",
      lineas_refuerzo: "",
      tipo_zocalo: "",
      tipo_piso: "",
      corte_guardabarros: false,
      cumbreras: false,
      notas: "",
      /* Datos del camión */
      tara_camion: undefined,
      marca_camion: "",
      modelo_camion: "",
      /* Cuchetin */
      cuchetin: false,
      med_cuchetin: undefined,
      alt_pta_cuchetin: undefined,
      alt_techo_cuchetin: undefined,
      notas_cuchetin: "",
      /* Accesorios */
      luces: undefined,
      guardabarros: false,
      dep_agua: false,
      ubicacion_dep_agua: "",
      cintas_reflectivas: "",
      /* Accesorios - Boquillas */
      boquillas: undefined,
      tipo_boquillas: "",
      /* Accesorios - Cajon de herramientas */
      med_cajon_herramientas: undefined,
      ubicacion_cajon_herramientas: "",
      /* Alargue */
      alargue_tipo_1: "",
      cant_alargue_1: undefined,
      med_alargue_1: undefined,
      quiebre_alargue_1: false,
      alargue_tipo_2: "",
      cant_alargue_2: undefined,
      med_alargue_2: undefined,
      quiebre_alargue_2: false,
    },
  });
  const isEditMode = Boolean(watch("id"));
  const onSubmit = async (data: FormValues) => {
    openModal("loading", { message: "Guardando carrocería usada..." });
    const { duenno, ...carroceriaData } = data;
    try {
      if (isEditMode) {
        const { duenno, ...dirtyFieldsData } = dirtyFields;
        const hasdirtyFields = Object.keys(dirtyFields).length > 0;
        if (!hasdirtyFields) {
          openModal("info", {
            message: "No se han realizado cambios para guardar",
          });
          return;
        }
        const { error } = await updateCarroceriaUsadaBase(
          carroceriaData as CarroceriaUsadaData,
          dirtyFieldsData,
        );
        if (error) {
          throw new Error("Error al actualizar la carrocería usada: " + error);
        }
        if (data.status === "vendida") {
          await getPedidosData();
        }
        openModal("success", {
          message: "Carrocería usada actualizada con éxito",
        });
      } else {
        const { error, success } = await createNewCarroceriaUsada(
          carroceriaData as CarroceriaUsadaData,
        );
        if (error) {
          throw new Error("Error al crear la carrocería usada: " + error);
        }
        if (success) {
          openModal("success", {
            props: {
              title: "Carrocería usada guardada",
              message: "Carrocería usada guardada con éxito.",
              onClose: () => {
                navigate("/carrocerias-usadas");
              },
            },
          });
        }
      }
    } catch (error) {
      console.error("Error al guardar la carrocería usada:", error);
      openModal("error", {
        message:
          "Hubo un error al guardar la carrocería usada. Por favor, inténtalo de nuevo.",
      });
    }
  };
  const guardaBarrosEnabled = watch("corte_guardabarros");
  useFormNavigationBlock<FormValues>({
    isDirty,
    isSubmitSuccessful,
    dirtyFields,
  });
  const InfoField = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number;
  }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-1">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {value || "-"}
      </span>
    </div>
  );
  const images: GalleryItem[] =
    data?.fotos?.map((foto) => ({
      original: foto.url,
      thumbnail: foto.url,
    })) || [];
  const onUpload = async (data: dataToPayload[]) => {
    if (!data || data.length === 0) return;
    openModal("loading", {
      props: {
        title: "Subiendo imágenes",
        message:
          "Las imágenes se están guardando en el servidor, por favor espera.",
      },
    });
    const newData = data.map((item) => ({
      ...item,
      carroceria_usada_id: watch("id")!,
    }));
    const result = await CUDFotos(newData as Fotos[], []);
    if (!result.success) {
      openModal("error", {
        message:
          "Hubo un error al subir las fotos. Por favor, inténtalo de nuevo.",
      });
    } else {
      openModal("success", {
        message: "Fotos subidas con éxito",
      });
    }
  };

  const MorphingInput = ({
    options,
    label,
    keyAttribute,
    required = false,
  }: {
    options: { value: string; label: string }[];
    label: string;
    keyAttribute: keyof FormValues;
    required?: boolean;
  }) => {
    const [isCustom, setIsCustom] = useState(false);
    const [custmOptions, setCustomOptions] = useState(options);
    if (isCustom) {
      return (
        <div className="flex flex-col gap-2 transition-all duration-300">
          <div className="relative flex items-center">
            <Input
              autoFocus
              type="text"
              label={`Especificar ${label}`}
              placeholder="Escribe tu opción..."
              onChange={(e) => {
                setValue(keyAttribute, e.target.value);
                setCustomOptions([
                  ...options,
                  {
                    value: e.target.value,
                    label: e.target.value,
                  },
                ]);
              }}
              requiredField={required}
              error={errors[keyAttribute]?.message}
            />
            <button
              onClick={() => {
                setIsCustom(false);
                setValue(keyAttribute, "");
              }}
              className="absolute top-9 right-2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
              title="Volver a la lista"
            >
              <LuRotateCcw size={18} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <Select
          label={label}
          {...register(keyAttribute, {
            required: required ? `El campo ${label} es requerido` : false,
          })}
          onChange={(e) => {
            if (e.target.value === "otro") {
              setIsCustom(true);
            } else {
              setValue(keyAttribute, e.target.value);
            }
          }}
          options={custmOptions}
          otro
          requiredField={required}
          error={errors[keyAttribute]?.message}
        />
      </div>
    );
  };
  return (
    <>
      {isEditMode && (
        <Card className="w-full mb-4">
          <div className="flex justify-between items-center md:items-end mb-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                Tipo de carrozado
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-white">
                {data?.tipo_carrozado}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <ImageFileComponent onUpload={onUpload} />
              <BadgeStatusCarroceriaUsada status={data?.status || "-"} />
            </div>
          </div>
          {/* Carrusel de fotos */}

          {data?.fotos && data.fotos.length > 0 && (
            <div className="max-w-2xl mx-auto rounded-lg mb-6">
              <ImageGallery
                items={images}
                showBullets={true}
                showPlayButton={false}
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-4 border-gray-300">
            <InfoField label="Color" value={data?.color} />
            <InfoField
              label="Precio lista"
              value={
                data?.precio_lista
                  ? data.precio_lista.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })
                  : "-"
              }
            />
            <InfoField
              label="Propietario anterior"
              value={data?.duenno?.razon_social}
            />
            <InfoField
              label="Fecha de recepción"
              value={
                data?.fecha_recepcion
                  ? formatDateUStoES(data.fecha_recepcion)
                  : "-"
              }
            />
            <InfoField
              label="Marca de carrocería"
              value={data?.marca_carroceria}
            />
            <InfoField
              label="Año de fabricación"
              value={data?.anno_fabricacion || "-"}
            />
          </div>
          {/* datos de préstamo */}
          {data?.status === "prestada" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-4 border-gray-300">
              <p className="col-span-full text-gray-500 dark:text-gray-400 tracking-widest uppercase text-xs">Datos de préstamo</p>
              <InfoField label="Cliente" value={clientes.find(cliente => cliente.id === data?.prestamo?.cliente_id)?.razon_social || "-"} />
              <InfoField
                label="Fecha de préstamo"
                value={
                  data?.prestamo?.fecha_prestamo
                    ? formatDateUStoES(data.prestamo.fecha_prestamo)
                    : "-"
                }
              />
              <InfoField
                label="Fecha de devolución"
                value={
                  data?.prestamo?.fecha_devolucion_estimada
                    ? formatDateUStoES(data.prestamo.fecha_devolucion_estimada)
                    : "-"
                }
              />
            </div>
          )}
        </Card>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
        <Accordion alwaysOpen>
          <AccordionPanel>
            <AccordionTitle>Datos principales de la toma</AccordionTitle>
            <AccordionContent>
              <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-y-4 gap-x-2">
                <div className="col-span-1 md:col-span-2">
                  <input
                    type="hidden"
                    {...register("duenno_id", {
                      required: "El propietario anterior es requerido",
                    })}
                  />
                  <SocioComponentForm
                    tipoSocio="cliente"
                    customLabel="Propietario anterior"
                    error={errors.duenno_id?.message}
                    value={watch(`duenno.razon_social`) || ""}
                    onSelect={(duenno: SocioComercial) => {
                      setValue("duenno_id", duenno.id, { shouldDirty: true });
                      setValue("duenno", duenno, { shouldDirty: true });
                    }}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <MorphingInput
                    options={carrozadosOptions.map((tipo) => ({
                      value: tipo.label,
                      label: tipo.label,
                    }))}
                    label="Carrozado"
                    keyAttribute="tipo_carrozado"
                    required
                  />
                </div>
                <Input
                  type="date"
                  label="Fecha de recepción"
                  {...register("fecha_recepcion")}
                />
                <CurrencyInput
                  label="Tasación"
                  name="tasacion"
                  control={control}
                  rules={{
                    required: "Este campo es requerido",
                    min: {
                      value: 0.01,
                      message: "La tasación debe ser mayor a cero",
                    },
                  }}
                  error={errors.tasacion?.message}
                  requiredField={true}
                  placeholder="$ 0,00"
                  icon={LuBanknote}
                  currencySymbol="$"
                  locale="es-AR"
                />
                <CurrencyInput
                  label="Precio lista"
                  name="precio_lista"
                  control={control}
                  placeholder="$ 0,00"
                  icon={LuBanknote}
                  currencySymbol="$"
                  locale="es-AR"
                />
                <Input
                  label="Marca de carrocería"
                  {...register("marca_carroceria", {
                    required: "La marca de carrocería es requerida",
                  })}
                  placeholder="Ej: Hermann, Gross, Sola y Brusa, etc."
                  requiredField
                  error={errors.marca_carroceria?.message}
                />
                <InputNumberIcon
                  label="Año de fabricación"
                  placeholder="Ej: 2019"
                  {...register("anno_fabricacion", {
                    required: "El año de fabricación es requerido",
                  })}
                  icon={BsCalendar2Week}
                  requiredField
                  error={errors.anno_fabricacion?.message}
                />

                <div className="md:col-span-4 mt-4 border-t pt-4 border-gray-300">
                  <h6 className="mb-2 font-semibold tracking-widest uppercase text-gray-500 text-sm">
                    Datos del camión donde estaba instalada
                  </h6>
                  <div className="grid md:grid-cols-3 gap-2">
                    <InputNumberIcon
                      label="Tara"
                      placeholder="Ej: 7500"
                      icon={TbDimensions}
                      {...register("tara_camion")}
                    />
                    <Input
                      label="Marca"
                      placeholder="Ej: Scania, Volvo, Mercedes, etc."
                      {...register("marca_camion")}
                    />
                    <Input
                      label="Modelo"
                      placeholder="Ej: R 450, FH 540, Actros 2651, etc."
                      {...register("modelo_camion")}
                    />
                  </div>
                </div>
              </fieldset>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
        <Accordion alwaysOpen>
          <AccordionPanel>
            <AccordionTitle>Características y dimensiones</AccordionTitle>
            <AccordionContent>
              <fieldset className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-3">
                  <Input
                    label="Carrozado"
                    value={watch("tipo_carrozado")}
                    disabled
                  />
                </div>
                <MorphingInput
                  options={materialOptions}
                  label="Material"
                  keyAttribute="material"
                />

                <MorphingInput
                  options={espesorOptions}
                  label="Espesor chapa"
                  keyAttribute="espesor_chapa"
                />
                <InputNumberIcon
                  label="Largo"
                  placeholder="Ej: 5400"
                  {...register("largo")}
                  icon={LuRuler}
                />
                <MorphingInput
                  options={anchoOptions}
                  label="Ancho"
                  keyAttribute="ancho"
                />
                <InputNumberIcon
                  label="Alto"
                  placeholder="Ej: 1700"
                  {...register("alto")}
                  icon={LuRuler}
                />
                <InputNumberIcon
                  label="Alt. baranda"
                  placeholder="Ej: 900"
                  {...register("alt_baranda")}
                  icon={LuRuler}
                />
                <InputNumberIcon
                  label="Ptas. por lado"
                  placeholder="Ej: 2"
                  {...register("ptas_por_lado")}
                  icon={LuRuler}
                />
                <MorphingInput
                  options={arcosOptions}
                  label="Arcos por puerta"
                  keyAttribute="arcos_por_puerta"
                />
                <MorphingInput
                  options={tiposArcosOptions}
                  label="Tipo de arcos"
                  keyAttribute="tipos_arcos"
                />
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <MorphingInput
                    options={puertasOptions.map((puerta) => ({
                      value: puerta.label,
                      label: puerta.label,
                    }))}
                    label="Puerta trasera"
                    keyAttribute="puerta_trasera"
                  />
                </div>
                <MorphingInput
                  options={lineasRefOptions}
                  label="Líneas de refuerzo"
                  keyAttribute="lineas_refuerzo"
                />
                <MorphingInput
                  options={zocaloOptions}
                  label="Tipo zócalo"
                  keyAttribute="tipo_zocalo"
                />
                <MorphingInput
                  options={pisoOptions}
                  label="Tipo piso"
                  keyAttribute="tipo_piso"
                />
                <div className="flex gap-4 md:col-span-2 mt-2">
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
                    label={`${watch("cumbreras") ? "Con cumbreras" : "Sin cumbreras"}`}
                    value={watch("cumbreras")}
                    onCustumChange={(checked) =>
                      setValue("cumbreras", checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
                <div className="col-span-1 md:col-span-3 lg:col-span-4">
                  <Textarea
                    label="Color"
                    {...register("color")}
                    placeholder="Detalle el color de la carrocería usada. Ej: Bermellón con zócalo negro y puerta trasera blanca"
                  />
                </div>
                <div className="col-span-1 md:col-span-3 lg:col-span-4">
                  <Textarea
                    label="Condición"
                    {...register("condicion")}
                    placeholder="Detalle la condición de la carrocería usada. Ej: Buen estado, con algunos rayones, etc."
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
          isOptional
        />
        <AlarguesForm
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
          isOptional
        />
        <Textarea
          label="Observaciones"
          placeholder="Observaciones adicionales sobre el pedido"
          {...register("notas")}
        />
        {!isEditMode && <ImageFileComponent onUpload={onUpload} />}
        <div className="space-y-2">
          <Button
            type="submit"
            className="ml-auto block"
            disabled={false}
            color={"cyan"}
          >
            Guardar carrocería usada
          </Button>
        </div>
      </form>
    </>
  );
}
