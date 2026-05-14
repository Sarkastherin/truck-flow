import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
} from "flowbite-react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import {
  ToggleSwitch,
  InputNumberIcon,
  Textarea,
  Select,
} from "~/components/InputsForm";
import { LuRuler } from "react-icons/lu";

type ModificarLargueroFields = {
  modificar_larguero: boolean;
  tipo_larguero?: string;
  med_larguero?: number;
  nota_larguero?: string;
};

export default function ModificarLargueroForm<
  T extends FieldValues & ModificarLargueroFields,
>({
  register,
  watch,
  setValue,
  errors,
  withAccordion,
  isOptional = false,
}: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  withAccordion: boolean;
  isOptional?: boolean;
}) {
  const largueroEnabled = watch("modificar_larguero" as Path<T>);

  const handleToggleLargueroSection = (checked: boolean) => {
    setValue(
      "modificar_larguero" as Path<T>,
      checked as PathValue<T, Path<T>>,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    if (!checked) {
      setValue("tipo_larguero" as Path<T>, null as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("med_larguero" as Path<T>, null as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("notas_larguero" as Path<T>, "" as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const content = (
    <fieldset className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex-2 space-y-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Configurar modificación de larguero
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Activá esta sección solo si la carroceria si aplica modificación de
            larguero.
          </p>
        </div>
        <ToggleSwitch
          id="cuchetin"
          label={
            largueroEnabled
              ? "Modificación de larguero activa"
              : "Sin modificación"
          }
          value={largueroEnabled}
          onCustumChange={handleToggleLargueroSection}
        />
      </div>

      {largueroEnabled ? (
        <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Select
              label="Tipo de larguero"
              {...register("tipo_larguero" as Path<T>, {
                required: "Este campo es obligatorio",
              })}
              requiredField={true}
              error={errors.tipo_larguero?.message as string | undefined}
              options={[
                { value: "recto", label: "Recto" },
                { value: "curvo", label: "Curvo" },
              ]}
            />
            <InputNumberIcon
              label="Medida (mm)"
              {...register("med_larguero" as Path<T>, {
                required: !isOptional ? "Este campo es obligatorio" : false,
                min: {
                  value: 0.1,
                  message: "La medida debe ser mayor a 0",
                },
              })}
              icon={LuRuler}
              requiredField={!isOptional}
              error={errors.med_larguero?.message as string | undefined}
            />
          </div>
          <Textarea
            label="Observaciones larguero"
            placeholder="Agregue notas u observaciones para el larguero si son necesarias"
            {...register("notas_larguero" as Path<T>)}
            rows={2}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Esta carroceria no lleva cuchetín. Activá la sección para cargar sus
          medidas y observaciones.
        </div>
      )}
    </fieldset>
  );

  if (!withAccordion) {
    return content;
  }

  return (
    <Accordion alwaysOpen>
      <AccordionPanel>
        <AccordionTitle>Modificar larguero</AccordionTitle>
        <AccordionContent>{content}</AccordionContent>
      </AccordionPanel>
    </Accordion>
  );
}
