import { type UseFormReturn } from "react-hook-form";
import {
  Input,
  Select,
  CurrencyInput,
  MorphingInput,
} from "~/components/InputsForm";
import InfoFieldsComponent from "~/components/InfoFieldsComponent";
import { optionSector, type MvtoEmpleados } from "~/types/rrhh";
import { LuBanknote } from "react-icons/lu";
import { Button } from "flowbite-react";

interface Props {
  title: string;
  form: UseFormReturn<MvtoEmpleados>;
  tipoMovimiento: "deuda" | "pago";
  onDelete?: () => void;
  onReactivate?: () => void;
}
export default function MvtoModal({ props }: { props: Props }) {
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
        label="Fecha"
        {...register("fecha_movimiento", {
          required: "La fecha es obligatorio",
        })}
        type="date"
        error={errors.fecha_movimiento?.message}
        requiredField
      />
      {/* <Select
        label="Categoría"
        {...register("tipo_movimiento", { required: "La categoría es obligatorio" })}
        error={errors.tipo_movimiento?.message}
        requiredField
        options={[
          {value: "deuda", label: "Deuda"},
          {value: "pago", label: "Pago"}
        ]}
      /> */}

      {props.tipoMovimiento === "deuda" && (
        <CurrencyInput
          label="Importe"
          name="debe"
          control={control}
          rules={{
            required: "El importe es obligatorio",
            min: { value: 0.01, message: "El importe debe ser mayor a 0" },
          }}
          error={errors.debe?.message}
          requiredField
          placeholder="$ 0.00"
          icon={LuBanknote}
          currencySymbol="$"
          locale="es-AR"
        />
      )}
      {props.tipoMovimiento === "pago" && (
        <CurrencyInput
          label="Importe"
          name="haber"
          control={control}
          rules={{
            required: "El importe es obligatorio",
            min: { value: 0.01, message: "El importe haber ser mayor a 0" },
          }}
          error={errors.haber?.message}
          requiredField
          placeholder="$ 0.00"
          icon={LuBanknote}
          currencySymbol="$"
          locale="es-AR"
        />
      )}
      <div className="col-span-full">
        <MorphingInput
          label="Concepto"
          name="concepto"
          control={control}
          options={[
            { value: "Préstamo", label: "Préstamo" },
            { value: "Alquiler", label: "Alquiler" },
            { value: "Adelanto", label: "Adelanto" },
          ]}
        />
      </div>

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
