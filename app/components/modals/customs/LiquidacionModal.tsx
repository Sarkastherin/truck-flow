import { type UseFormReturn } from "react-hook-form";
import { Input } from "~/components/InputsForm";
import { type Liquidacion } from "~/types/liquidaciones";

interface Props {
  title: string;
  form: UseFormReturn<Liquidacion>;
  onDelete?: () => void;
  onReactivate?: () => void;
}
export default function LiquidacionModal({ props }: { props: Props }) {
  const { form } = props;
  const {
    register,
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
    </fieldset>
  );
}
