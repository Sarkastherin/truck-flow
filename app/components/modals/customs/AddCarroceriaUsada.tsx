import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import type { CommonTypes } from "~/types/commonTypes";
import type { UseFormReturn } from "react-hook-form";
import { Input, Textarea, Select } from "~/components/InputsForm";
import { useState } from "react";
import { LuRotateCcw } from "react-icons/lu";
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
  const { register, setValue, formState:{errors} } = form;
  const { carrozadosOptions } = useConfiguracion();
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
            {...register(keyAttribute,{ required: required ? `El campo ${label} es requerido` : false })}
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
    <fieldset
      className="grid grid-cols-2 gap-2"
      disabled={form.formState.isSubmitting}
    >
      <div className="col-span-2">
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
