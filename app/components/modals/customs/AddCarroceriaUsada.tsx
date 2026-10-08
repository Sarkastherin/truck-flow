import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import type { CommonTypes } from "~/types/commonTypes";
import type { UseFormReturn } from "react-hook-form";
import { Input, MorphingInput } from "~/components/InputsForm";
import { useConfiguracion } from "~/context/ConfiguracionesContext";

type FormValues = Omit<CarroceriaUsadaData, keyof CommonTypes> & {
  id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
};
export function AddCarroceriaUsada({
  props,
}: {
  props: {
    title: string;
    form: UseFormReturn<FormValues>;
  };
}) {
  const { form } = props;
  const { register, control, formState: { errors } } = form;
  const { carrozadosOptions } = useConfiguracion();
  return (
    <fieldset
      className="grid grid-cols-2 gap-2"
      disabled={form.formState.isSubmitting}
    >
      <div className="col-span-2">
        <MorphingInput
          label="Carrozado"
          name="tipo_carrozado"
          control={control}
          options={carrozadosOptions.map((tipo) => ({
            value: tipo.label,
            label: tipo.label,
          }))}
          error={errors.tipo_carrozado?.message}
          requiredField
        />
      </div>
      <Input
        label="Marca de carrocería"
        {...register("marca_carroceria")}
        placeholder="Ej: Mercedez Benz, Volvo, etc."
      />
      <Input
        label="Año de fabricación"
        {...register("anno_fabricacion")}
        placeholder="Ej: 2020, 2021, etc."
      />
      <div className="col-span-2">
        <Input
          label="Color"
          {...register("color")}
          placeholder="Ej: Blanco, rojo, etc."
        />
      </div>
    </fieldset>
  );
}
