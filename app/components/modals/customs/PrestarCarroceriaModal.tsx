import { type UseFormReturn } from "react-hook-form";
import type {
  PrestamoCarroceria,
  CarroceriaUsadaData,
} from "~/types/carroceria-usada";
import { Input, Textarea } from "~/components/InputsForm";
import type { CommonTypes } from "~/types/commonTypes";
import { InfoField } from "~/components/InfoField";

type FormValues = Omit<PrestamoCarroceria, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
};
export function PrestarCarroceriaModal({
  props,
}: {
  props: {
    title: string;
    form: UseFormReturn<FormValues>;
    carroceriaData?: CarroceriaUsadaData;
    isDevolucion?: boolean;
  };
}) {
  const { form } = props;
  const { register } = form;

  return (
    <>
      {form.watch("id") && (
        <div className="flex flex-col gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
          <p className="text-xs tracking-widest font-bold uppercase text-gray-500">
            Datos de la carrocería usada
          </p>
          <InfoField
            label="Tipo de carrozado"
            value={props.carroceriaData?.tipo_carrozado}
          />
          <InfoField label="Color" value={props.carroceriaData?.color} />
          <div className="flex gap-2">
            <InfoField
              label="Marca"
              value={props.carroceriaData?.marca_carroceria}
            />
            <InfoField
              label="Modelo"
              value={
                String(props.carroceriaData?.anno_fabricacion) ||
                "Sin información"
              }
            />
          </div>
        </div>
      )}
      {!props.isDevolucion && (
        <fieldset
          className="grid grid-cols-1 gap-2"
          disabled={form.formState.isSubmitting}
        >
          <p className="text-xs tracking-widest font-bold uppercase text-gray-500">
            Datos del préstamo
          </p>
          <Input
            label="Fecha de préstamo"
            type="date"
            {...register("fecha_prestamo", {
              required: "Indique una fecha de préstamo",
            })}
            requiredField
            error={form.formState.errors.fecha_prestamo?.message}
          />
          <Input
            label="Fecha devolución estimada"
            type="date"
            {...register("fecha_devolucion_estimada")}
          />
          <Textarea
            label="Observaciones"
            placeholder="Información adicional sobre el prestamo"
            {...register("notas_prestamo")}
          />
        </fieldset>
      )}
      {props.isDevolucion && (
        <fieldset
          className="grid grid-cols-1 gap-2"
          disabled={form.formState.isSubmitting}
        >
          <p className="text-xs tracking-widest font-bold uppercase text-gray-500">
            Datos de devolución
          </p>
          <Input
            label="Fecha devolución"
            type="date"
            {...register("fecha_devolucion", {
              required: "Indique una fecha de devolución",
            })}
            requiredField
            error={form.formState.errors.fecha_devolucion?.message}
          />
          <Textarea
            label="Observaciones"
            placeholder="Información adicional sobre el prestamo"
            {...register("notas_devolucion")}
          />
        </fieldset>
      )}
    </>
  );
}
