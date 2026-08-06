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
  Input,
} from "~/components/InputsForm";
import type { ModificarColorFields } from "~/types/pedido";

export default function ModificarColorForm<
  T extends FieldValues & ModificarColorFields,
>({
  register,
  watch,
  setValue,
  withAccordion,
}: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  withAccordion: boolean;
}) {
  const colorEnabled = watch("cambio_color" as Path<T>);

  const handleToggleColorSection = (checked: boolean) => {
    setValue(
      "cambio_color" as Path<T>,
      checked as PathValue<T, Path<T>>,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    if (!checked) {
      setValue("color_carrozado" as Path<T>, null as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("color_zocalo" as Path<T>, null as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("notas_color" as Path<T>, "" as PathValue<T, Path<T>>, {
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
            Configurar modificación de color
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Activá esta sección solo si la carroceria si aplica modificación de
            color.
          </p>
        </div>
        <ToggleSwitch
          id="cambio_color"
          label={
            colorEnabled
              ? "Modificación de color activa"
              : "Sin modificación"
          }
          value={colorEnabled}
          onCustumChange={handleToggleColorSection}
        />
      </div>

      {colorEnabled ? (
        <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
            label="Color carrozado"
              {...register("color_carrozado" as Path<T>, )}
            />
            <Input
              label="Color zócalo"
              {...register("color_zocalo" as Path<T>)}
            />
          </div>
          <Textarea
            label="Observaciones color"
            placeholder="Agregue notas u observaciones para el color si son necesarias"
            {...register("notas_color" as Path<T>)}
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
        <AccordionTitle>Modificar color</AccordionTitle>
        <AccordionContent>{content}</AccordionContent>
      </AccordionPanel>
    </Accordion>
  );
}
