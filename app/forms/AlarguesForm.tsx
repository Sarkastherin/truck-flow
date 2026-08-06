import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
} from "flowbite-react";
import { InputNumberIcon, ToggleSwitch } from "~/components/InputsForm";
import { buildFieldPath, getFieldError } from "~/utils/formFieldHelpers";
import { LuRuler } from "react-icons/lu";
import type {
  FieldErrors,
  FieldValues,
  PathValue,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

type AlarguesFieldName =
  | "alargue_tipo_1"
  | "alargue_tipo_2"
  | "cant_alargue_1"
  | "med_alargue_1"
  | "quiebre_alargue_1"
  | "cant_alargue_2"
  | "med_alargue_2"
  | "quiebre_alargue_2";

export default function AlarguesForm<
  TFieldValues extends FieldValues = FieldValues,
>({
  register,
  watch,
  setValue,
  errors,
  namePrefix,
  withAccordion = true,
}: {
  register: UseFormRegister<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  namePrefix?: string;
  withAccordion?: boolean;
}) {
  const buildFieldName = (fieldName: AlarguesFieldName) => {
    return buildFieldPath<TFieldValues>(fieldName, namePrefix);
  };
  const getErrorMessage = (fieldName: AlarguesFieldName) => {
    return getFieldError(errors, buildFieldName(fieldName));
  };
  const alargueTipo1Enabled =
    watch(buildFieldName("alargue_tipo_1")) === "baranda a cumbrera";
  const alargueTipo2Enabled =
    watch(buildFieldName("alargue_tipo_2")) === "sobre cumbrera";
  const alarguesEnabled = alargueTipo1Enabled || alargueTipo2Enabled;

  const handleToggleAlarguesSection = (checked: boolean) => {
    if (checked) {
      handleToggleAlargue(true, "alargue_tipo_1");
      return;
    }

    handleToggleAlargue(false, "alargue_tipo_1");
    handleToggleAlargue(false, "alargue_tipo_2");
  };
  const handleToggleAlargue = (
    checked: boolean,
    tipo: "alargue_tipo_1" | "alargue_tipo_2",
  ) => {
    const isFirstType = tipo === "alargue_tipo_1";

    setValue(
      buildFieldName(tipo),
      checked
        ? ((isFirstType ? "baranda a cumbrera" : "sobre cumbrera") as PathValue<
            TFieldValues,
            ReturnType<typeof buildFieldName>
          >)
        : ("N/A" as PathValue<TFieldValues, ReturnType<typeof buildFieldName>>),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    if (!checked) {
      setValue(
        buildFieldName(isFirstType ? "cant_alargue_1" : "cant_alargue_2"),
        null as PathValue<TFieldValues, ReturnType<typeof buildFieldName>>,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
      setValue(
        buildFieldName(isFirstType ? "med_alargue_1" : "med_alargue_2"),
        null as PathValue<TFieldValues, ReturnType<typeof buildFieldName>>,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
      setValue(
        buildFieldName(isFirstType ? "quiebre_alargue_1" : "quiebre_alargue_2"),
        false as PathValue<TFieldValues, ReturnType<typeof buildFieldName>>,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  const handleToggleQuiebre = (
    fieldName: "quiebre_alargue_1" | "quiebre_alargue_2",
    checked: boolean,
  ) => {
    setValue(
      buildFieldName(fieldName),
      checked as PathValue<TFieldValues, ReturnType<typeof buildFieldName>>,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const content = (
    <fieldset className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-900/40">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Configurar alargues
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Activá esta sección solo si la carroceria lleva uno o más alargues.
          </p>
        </div>
        <ToggleSwitch
          id={namePrefix ? `${namePrefix}.activar_alargues` : "activar_alargues"}
          label={alarguesEnabled ? "Alargues activos" : "Sin alargues"}
          value={alarguesEnabled}
          onCustumChange={handleToggleAlarguesSection}
        />
      </div>

      {alarguesEnabled ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Baranda a cumbrera
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Mostrá esta configuración solo si este tipo de alargue aplica.
                </p>
              </div>
              <ToggleSwitch
                id={String(buildFieldName("alargue_tipo_1"))}
                label={alargueTipo1Enabled ? "Activo" : "Inactivo"}
                value={alargueTipo1Enabled}
                onCustumChange={(value) =>
                  handleToggleAlargue(value, "alargue_tipo_1")
                }
              />
            </div>

            {alargueTipo1Enabled ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <InputNumberIcon
                  label="Cantidad"
                  {...register(buildFieldName("cant_alargue_1"), {
                    min: {
                      value: 0.1,
                      message: "La medida debe ser mayor a 0",
                    },
                    required: "Este campo es obligatorio",
                  })}
                  requiredField
                  icon={LuRuler}
                  error={getErrorMessage("cant_alargue_1")}
                />
                <InputNumberIcon
                  label="Medida"
                  {...register(buildFieldName("med_alargue_1"), {
                    min: {
                      value: 0.1,
                      message: "La medida debe ser mayor a 0",
                    },
                    required: "Este campo es obligatorio",
                  })}
                  requiredField
                  icon={LuRuler}
                  error={getErrorMessage("med_alargue_1")}
                />
                <div className="pb-1">
                  <ToggleSwitch
                    id={String(buildFieldName("quiebre_alargue_1"))}
                    label="Quiebre en alargue"
                    value={Boolean(watch(buildFieldName("quiebre_alargue_1")))}
                    onCustumChange={(checked) =>
                      handleToggleQuiebre("quiebre_alargue_1", checked)
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Este tipo no está configurado.
              </p>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Sobre cumbrera
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Activá este bloque si el pedido requiere un segundo alargue.
                </p>
              </div>
              <ToggleSwitch
                id={String(buildFieldName("alargue_tipo_2"))}
                label={alargueTipo2Enabled ? "Activo" : "Inactivo"}
                value={alargueTipo2Enabled}
                onCustumChange={(checked) =>
                  handleToggleAlargue(checked, "alargue_tipo_2")
                }
              />
            </div>

            {alargueTipo2Enabled ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <InputNumberIcon
                  label="Cantidad"
                  {...register(buildFieldName("cant_alargue_2"), {
                    min: {
                      value: 0.1,
                      message: "La medida debe ser mayor a 0",
                    },
                    required: "Este campo es obligatorio",
                  })}
                  requiredField
                  icon={LuRuler}
                  error={getErrorMessage("cant_alargue_2")}
                />
                <InputNumberIcon
                  label="Medida"
                  {...register(buildFieldName("med_alargue_2"), {
                    min: {
                      value: 0.1,
                      message: "La medida debe ser mayor a 0",
                    },
                    required: "Este campo es obligatorio",
                  })}
                  requiredField
                  icon={LuRuler}
                  error={getErrorMessage("med_alargue_2")}
                />
                <div className="pb-1">
                  <ToggleSwitch
                    id={String(buildFieldName("quiebre_alargue_2"))}
                    label="Quiebre en alargue"
                    value={Boolean(watch(buildFieldName("quiebre_alargue_2")))}
                    onCustumChange={(checked) =>
                      handleToggleQuiebre("quiebre_alargue_2", checked)
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Este tipo no está configurado.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Esta carroceria no lleva alargues. Activá la sección para cargar uno o
          ambos tipos.
        </div>
      )}

      {alarguesEnabled ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {Number(alargueTipo1Enabled) + Number(alargueTipo2Enabled)} tipo
          {Number(alargueTipo1Enabled) + Number(alargueTipo2Enabled) === 1
            ? ""
            : "s"}{" "}
          de alargue configurado
          {Number(alargueTipo1Enabled) + Number(alargueTipo2Enabled) === 1
            ? ""
            : "s"}
          .
        </p>
      ) : null}
    </fieldset>
  );
  if (!withAccordion) {
    return content;
  }

  return (
    <Accordion alwaysOpen>
      <AccordionPanel>
        <AccordionTitle>Alargues</AccordionTitle>
        <AccordionContent>{content}</AccordionContent>
      </AccordionPanel>
    </Accordion>
  );
}
