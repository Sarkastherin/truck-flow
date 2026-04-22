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
} from "~/components/InputsForm";
import { LuRuler } from "react-icons/lu";

type CuchetinFields = {
  cuchetin: boolean;
  med_cuchetin: number | null;
  alt_pta_cuchetin: number | null;
  alt_techo_cuchetin: number | null;
  notas_cuchetin?: string;
};

export default function CuchetinForm<T extends FieldValues & CuchetinFields>({
  register,
  watch,
  setValue,
  errors,
  withAccordion,
}: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  withAccordion: boolean;
}) {
  const cuchetinEnabled = watch("cuchetin" as Path<T>);

  const handleToggleCuchetinSection = (checked: boolean) => {
    setValue("cuchetin" as Path<T>, checked as PathValue<T, Path<T>>, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!checked) {
      setValue("med_cuchetin" as Path<T>, null as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("alt_pta_cuchetin" as Path<T>, null as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("alt_techo_cuchetin" as Path<T>, null as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("notas_cuchetin" as Path<T>, "" as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const content = (
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
              {...register("med_cuchetin" as Path<T>, {
                required: "Este campo es obligatorio",
                min: {
                  value: 0.1,
                  message: "La medida debe ser mayor a 0",
                },
              })}
              icon={LuRuler}
              requiredField
              error={errors.med_cuchetin?.message as string | undefined}
            />
            <InputNumberIcon
              label="Altura puerta (mm)"
              {...register("alt_pta_cuchetin" as Path<T>, {
                required: "Este campo es obligatorio",
                min: {
                  value: 0.1,
                  message: "La medida debe ser mayor a 0",
                },
              })}
              icon={LuRuler}
              requiredField
              error={errors.alt_pta_cuchetin?.message as string | undefined}
            />
            <InputNumberIcon
              label="Altura techo (mm)"
              {...register("alt_techo_cuchetin" as Path<T>, {
                required: "Este campo es obligatorio",
                min: {
                  value: 0.1,
                  message: "La medida debe ser mayor a 0",
                },
              })}
              icon={LuRuler}
              requiredField
              error={errors.alt_techo_cuchetin?.message as string | undefined}
            />
          </div>
          <Textarea
            label="Observaciones cuchetín"
            placeholder="Agregue notas u observaciones para el cuchetin si son necesarias"
            {...register("notas_cuchetin" as Path<T>)}
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
        <AccordionTitle>Cuchetín</AccordionTitle>
        <AccordionContent>{content}</AccordionContent>
      </AccordionPanel>
    </Accordion>
  );
}