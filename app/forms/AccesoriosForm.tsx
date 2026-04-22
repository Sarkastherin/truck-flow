import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
} from "flowbite-react";
import { InputNumberIcon, Select, ToggleSwitch } from "~/components/InputsForm";
import { buildFieldPath, getFieldError } from "~/utils/formFieldHelpers";

import {
  cintasOptions,
  tiposBoquillasOptions,
  ubicacionOptions,
} from "~/types/pedido";
import { LuRuler } from "react-icons/lu";
import type {
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

type AccesoriosFieldName =
  | "tipo_boquillas"
  | "boquillas"
  | "ubicacion_cajon_herramientas"
  | "med_cajon_herramientas"
  | "luces"
  | "cintas_reflectivas"
  | "guardabarros"
  | "dep_agua"
  | "ubicacion_dep_agua";

export default function AccesoriosForm<
  TFieldValues extends FieldValues = FieldValues,
>({
  register,
  watch,
  setValue,
  errors,
  namePrefix,
  withAccordion = true,
  isOptional = false,
}: {
  register: UseFormRegister<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  namePrefix?: string;
  withAccordion?: boolean;
  isOptional?: boolean;
}) {
  const buildFieldName = (fieldName: AccesoriosFieldName) => {
    return buildFieldPath<TFieldValues>(fieldName, namePrefix);
  };

  const getErrorMessage = (fieldName: AccesoriosFieldName) => {
    return getFieldError(errors, buildFieldName(fieldName));
  };

  const tipoBoquillas = watch(buildFieldName("tipo_boquillas"));
  const ubicacionCajon = watch(buildFieldName("ubicacion_cajon_herramientas"));
  const depositoAgua = Boolean(watch(buildFieldName("dep_agua")));
  const guardabarros = Boolean(watch(buildFieldName("guardabarros")));

  const handleChangeBoquillasField = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedBoquillas = e.target.value;
    if (selectedBoquillas === "N/A") {
      setValue(
        buildFieldName("boquillas"),
        0 as PathValue<TFieldValues, Path<TFieldValues>>,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };
  const handleChangeCajonField = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCajon = e.target.value;
    if (selectedCajon === "N/A") {
      setValue(
        buildFieldName("med_cajon_herramientas"),
        0 as PathValue<TFieldValues, Path<TFieldValues>>,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };
  const handleToggleField = (
    fieldName: "guardabarros" | "dep_agua",
    checked: boolean,
  ) => {
    setValue(
      buildFieldName(fieldName),
      checked as PathValue<TFieldValues, Path<TFieldValues>>,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    if (fieldName === "dep_agua" && !checked) {
      setValue(
        buildFieldName("ubicacion_dep_agua"),
        "" as PathValue<TFieldValues, Path<TFieldValues>>,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  const content = (
    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
      <Select
        label="Tipos de boquillas"
        {...register(buildFieldName("tipo_boquillas"), {
          onChange: handleChangeBoquillasField,
          required: !isOptional ? "Este campo es obligatorio" : false,
        })}
        error={getErrorMessage("tipo_boquillas")}
        requiredField={!isOptional}
        options={tiposBoquillasOptions}
      />
      <InputNumberIcon
        label="Cantidad de boquillas"
        {...register(buildFieldName("boquillas"), {
          required: !isOptional ? "Este campo es obligatorio" : false,
          min: {
            value: tipoBoquillas !== "N/A" ? 0.1 : 0,
            message: "La medida debe ser mayor a 0",
          },
          valueAsNumber: true,
        })}
        requiredField={tipoBoquillas !== "N/A" && !isOptional}
        icon={LuRuler}
        error={getErrorMessage("boquillas")}
        disabled={tipoBoquillas === "N/A"}
      />
      <Select
        label="Ubic. cajón de herramientas"
        {...register(buildFieldName("ubicacion_cajon_herramientas"), {
          onChange: handleChangeCajonField,
          required: !isOptional ? "Este campo es obligatorio" : false,
        })}
        error={getErrorMessage("ubicacion_cajon_herramientas")}
        requiredField={!isOptional}
        options={ubicacionOptions}
      />
      <InputNumberIcon
        label="Medida cajón de herramientas"
        {...register(buildFieldName("med_cajon_herramientas"))}
        icon={LuRuler}
        error={getErrorMessage("med_cajon_herramientas")}
        disabled={ubicacionCajon === "N/A" || ubicacionCajon === undefined}
      />

      <InputNumberIcon
        label="Cantidad de luces"
        {...register(buildFieldName("luces"))}
        icon={LuRuler}
        error={getErrorMessage("luces")}
      />
      <Select
        label="Cintas reflectivas"
        {...register(buildFieldName("cintas_reflectivas"))}
        error={getErrorMessage("cintas_reflectivas")}
        options={cintasOptions}
      />
      <ToggleSwitch
        id={String(buildFieldName("guardabarros"))}
        label="Guardabarros"
        value={guardabarros}
        onCustumChange={(checked) => handleToggleField("guardabarros", checked)}
      />
      <ToggleSwitch
        id={String(buildFieldName("dep_agua"))}
        label="Depósito de agua"
        value={depositoAgua}
        onCustumChange={(checked) => handleToggleField("dep_agua", checked)}
      />
      <Select
        label="Ubic. depósito de agua"
        {...register(buildFieldName("ubicacion_dep_agua"), {
          required: {
            value: depositoAgua === true,
            message: "Este campo es obligatorio",
          },
        })}
        error={getErrorMessage("ubicacion_dep_agua")}
        disabled={!depositoAgua}
        requiredField={depositoAgua}
        options={ubicacionOptions}
      />
    </fieldset>
  );

  if (!withAccordion) {
    return content;
  }

  return (
    <Accordion alwaysOpen>
      <AccordionPanel>
        <AccordionTitle>Accessorios</AccordionTitle>
        <AccordionContent>{content}</AccordionContent>
      </AccordionPanel>
    </Accordion>
  );
}
