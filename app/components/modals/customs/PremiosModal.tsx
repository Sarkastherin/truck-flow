import { type UseFormReturn } from "react-hook-form";
import {
  Input,
  Select,
  CurrencyInput,
} from "~/components/InputsForm";
import InfoFieldsComponent from "~/components/InfoFieldsComponent";
import {
  optionSector,
  type Premios,
} from "~/types/rrhh";
import { LuBanknote} from "react-icons/lu";
import { Button } from "flowbite-react";


interface Props {
  title: string;
  form: UseFormReturn<Premios>;
  onDelete?: () => void;
  onReactivate?: () => void;
}
export default function PremiosModal({ props }: { props: Props }) {
  const { form } = props;
  const {
    register,
    control,
    formState: { errors },
  } = form;
  return (
    <fieldset
      className="grid grid-cols-2 flex-col gap-2"
      disabled={form.formState.isSubmitting}
    >
      <Input
        label="Nombre"
        {...register("nombre", {
          required: "El nombre es obligatorio",
        })}
        error={errors.nombre?.message}
        requiredField
      />
      <CurrencyInput
            label="Valor"
            name="precio"
            control={control}
            rules={{
              required: "El importe es obligatorio",
              min: { value: 0.01, message: "El importe debe ser mayor a 0" },
            }}
            error={errors.precio?.message}
            requiredField
            placeholder="$ 0.00"
            icon={LuBanknote}
            currencySymbol="$"
            locale="es-AR"
          />

      <Select
        label="Sector"
        {...register("sector", { required: "El area es obligatorio" })}
        error={errors.sector?.message}
        requiredField
        options={optionSector}
      />
      <Select
        label="Tipo"
        {...register("tipo", {
          required: "El tipo es obligatorio",
        })}
        error={errors.tipo?.message}
        requiredField
        options={[
          {value: "carroceria", label: "Carrocería"},
          {value: "accesorios", label: "Accesorios"}
        ]}
      />
      <div className="col-span-2 mt-2">
        {props.onDelete && (
          <Button
            type="button"
            onClick={props.onDelete}
            color="red"
            className="w-full"
            outline={true}
          >
            Dar de baja
          </Button>
        )}
        {props.onReactivate && (
          <Button
            type="button"
            onClick={props.onReactivate}
            color="green"
            className="w-full"
            outline={true}
          >
            Reactivar Empleado
          </Button>
        )}
      </div>
      <div className="col-span-full">
        <InfoFieldsComponent
          created_at={form.getValues("created_at")}
          created_by={form.getValues("created_by")}
          updated_at={form.getValues("updated_at")}
          updated_by={form.getValues("updated_by")}
        />
      </div>
    </fieldset>
  );
}
