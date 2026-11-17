import { type UseFormReturn } from "react-hook-form";
import { Input, ToggleSwitch } from "~/components/InputsForm";
import { type LiquidacionFormValues } from "~/types/liquidaciones";

interface Props {
  title: string;
  form: UseFormReturn<LiquidacionFormValues>;
  onDelete?: () => void;
  onReactivate?: () => void;
}
export default function LiquidacionModal({ props }: { props: Props }) {
  const { form } = props;
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  return (
    <fieldset
      className="grid grid-cols-2 flex-col gap-2"
      disabled={form.formState.isSubmitting}
    >
      <Input
        label="Desde"
        type="date"
        {...register("desde", {
          required: "Debe ingresar una fecha de inicio del periodo",
        })}
        error={errors.desde?.message}
      />
      <Input
        label="Hasta"
        type="date"
        {...register("hasta", {
          required: "Debe ingresar una fecha de fin del periodo",
        })}
        error={errors.hasta?.message}
      />
      <div className="col-span-full mt-2">
        <ToggleSwitch
          id="bono_quincenal"
          label={`${watch("bono_quincenal") ? "✅ Con bono quincenal" : "❌ No aplica bono quincenal"}`}
          value={watch("bono_quincenal")}
            onCustumChange={(checked) => {
              setValue("bono_quincenal", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
        />
      </div>
    </fieldset>
  );
}
