import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Input, CurrencyInput, MorphingInput } from "~/components/InputsForm";
import InfoFieldsComponent from "~/components/InfoFieldsComponent";
import { type MvtoEmpleadosFormValues } from "~/types/rrhh";
import { LuBanknote, LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "flowbite-react";
import { getFieldError } from "~/utils/formFieldHelpers";
import { formatCurrency } from "~/utils/formats";

interface Props {
  title: string;
  form: UseFormReturn<MvtoEmpleadosFormValues>;
  tipoMovimiento: "deuda" | "pago";
  onDelete?: () => void;
  onReactivate?: () => void;
}

const conceptoOptions = [
  { value: "Préstamo", label: "Préstamo" },
  { value: "Alquiler", label: "Alquiler" },
  { value: "Adelanto", label: "Adelanto" },
  { value: "Pagaré", label: "Pagaré" },
];

const emptyRow = () => ({
  fecha_movimiento: new Date().toISOString().split("T")[0],
  concepto: "",
  importe: 0,
});

export default function MvtoModal({ props }: { props: Props }) {
  const { form, tipoMovimiento } = props;
  const {
    register,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "movimientos",
  });
  const movimientos = watch("movimientos") ?? [];
  const eliminados = watch("eliminados") ?? [];
  const esDeuda = tipoMovimiento === "deuda";
  const total = movimientos.reduce(
    (acc, row) => acc + (Number(row?.importe) || 0),
    0,
  );
  const labelImporte = esDeuda ? "Importe [DEBE]" : "Importe [HABER]";

  const handleRemove = (index: number) => {
    const row = movimientos[index];
    if (row?.id) {
      const actuales = getValues("eliminados") ?? [];
      setValue("eliminados", [...new Set([...actuales, row.id])]);
    }
    remove(index);
  };

  return (
    <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm dark:border-indigo-800 dark:bg-indigo-950/40">
        <span className="font-medium text-indigo-700 dark:text-indigo-300">
          {fields.length} movimiento{fields.length === 1 ? "" : "s"}
          {isSubmitting && "..."}
        </span>
        <span className="text-base-600 dark:text-base-300">
          Total {labelImporte}:{" "}
          <b className="font-bold text-indigo-700 dark:text-indigo-300">
            {formatCurrency(total)}
          </b>
        </span>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative rounded-xl border border-base-200 bg-base-50/60 p-3 dark:border-base-700 dark:bg-base-800/50"
        >
          <button
            type="button"
            title="Quitar movimiento"
            onClick={() => handleRemove(index)}
            disabled={isSubmitting}
            className="absolute -top-3 -right-3 rounded-full border border-base-300 bg-white p-1.5 text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-base-600 dark:bg-base-900 dark:text-red-400 dark:hover:bg-red-600"
          >
            <LuTrash2 size={14} />
          </button>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Fecha"
              {...register(`movimientos.${index}.fecha_movimiento`, {
                required: "La fecha es obligatorio",
              })}
              type="date"
              error={getFieldError(
                errors,
                `movimientos.${index}.fecha_movimiento`,
              )}
              requiredField
            />
            <CurrencyInput
              label={labelImporte}
              name={`movimientos.${index}.importe`}
              control={control}
              rules={{
                required: "El importe es obligatorio",
                min: { value: 0.01, message: "El importe debe ser mayor a 0" },
              }}
              error={getFieldError(errors, `movimientos.${index}.importe`)}
              requiredField
              placeholder="$ 0.00"
              icon={LuBanknote}
              currencySymbol="$"
              locale="es-AR"
            />
            <MorphingInput
              label="Concepto"
              name={`movimientos.${index}.concepto`}
              control={control}
              options={conceptoOptions}
              error={getFieldError(errors, `movimientos.${index}.concepto`)}
            />
          </div>
        </div>
      ))}

      {fields.length === 0 && (
        <p className="rounded-lg border-2 border-dashed border-base-300 py-8 text-center text-sm text-base-500 dark:border-base-600 dark:text-base-400">
          Sin movimientos cargados. Agregá uno para continuar.
        </p>
      )}

      {eliminados.length > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {eliminados.length} movimiento
          {eliminados.length === 1 ? "" : "s"} se eliminará
          {eliminados.length === 1 ? "" : "n"} al guardar
        </p>
      )}

      <button
        type="button"
        onClick={() => append(emptyRow())}
        disabled={isSubmitting}
        className="w-full rounded-lg border-2 border-dashed border-base-300 bg-base-50/50 p-3 transition-all hover:border-indigo-400 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-base-600 dark:bg-base-800/50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30"
      >
        <span className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
          <LuPlus size={16} /> Agregar movimiento
        </span>
      </button>

      <div className="flex flex-col gap-2">
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
      <InfoFieldsComponent
        created_at={form.getValues("created_at")}
        created_by={form.getValues("created_by")}
        updated_at={form.getValues("updated_at")}
        updated_by={form.getValues("updated_by")}
      />
    </fieldset>
  );
}
