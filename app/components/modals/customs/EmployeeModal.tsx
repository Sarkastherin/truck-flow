import { type UseFormReturn, useWatch, Controller } from "react-hook-form";
import {
  Input,
  PhoneInput,
  Select,
  CurrencyInput,
  ToggleSwitch,
  MorphingInput,
} from "~/components/InputsForm";
import InfoFieldsComponent from "~/components/InfoFieldsComponent";
import {
  optionsTipoPago,
  optionsAreas,
  type Employee,
  optionsSeguro,
  optionsvehiculo,
} from "~/types/rrhh";
import { LuBanknote } from "react-icons/lu";
import { Label, ButtonGroup, Button } from "flowbite-react";

const tallesRemera = ["S", "M", "L", "XL", "XXL"];

interface Props {
  title: string;
  form: UseFormReturn<Employee>;
  onDelete?: () => void;
  onReactivate?: () => void;
}
export default function EmployeeModal({ props }: { props: Props }) {
  const { form } = props;
  const {
    register,
    setValue,
    control,
    watch,
    formState: { errors },
  } = form;
  const telefono = useWatch({
    control,
    name: "telefono",
  });
  const contactoEmergencia = useWatch({
    control,
    name: "contacto_emergencia",
  });
  return (
    <fieldset
      className="grid grid-cols-2 flex-col gap-2"
      disabled={form.formState.isSubmitting}
    >
      <Input
        label="Nombre completo"
        {...register("nombre_completo", {
          required: "El nombre es obligatorio",
        })}
        error={errors.nombre_completo?.message}
        requiredField
      />
      <Input
        label="Documento (DNI)"
        {...register("dni", {
          required: "El dni es obligatorio",
        })}
        error={errors.dni?.message}
        requiredField
      />

      <Select
        label="Área"
        {...register("area", { required: "El area es obligatorio" })}
        error={errors.tipo_pago?.message}
        requiredField
        options={optionsAreas}
      />
      <Select
        label="Tipo de contrato"
        {...register("tipo_pago", {
          required: "El tipo de contrato es obligatorio",
        })}
        error={errors.tipo_pago?.message}
        requiredField
        options={optionsTipoPago}
      />
      {watch("tipo_pago") === "Salario semanal" && (
        <>
          <CurrencyInput
            label="Salario semanal"
            name="valor_salario_semanal"
            control={control}
            rules={{
              required: "El importe es obligatorio",
              min: { value: 0.01, message: "El importe debe ser mayor a 0" },
            }}
            error={errors.valor_salario_semanal?.message}
            requiredField
            placeholder="$ 0.00"
            icon={LuBanknote}
            currencySymbol="$"
            locale="es-AR"
          />
          <CurrencyInput
            label="Valor Hora Extra"
            name="valor_hora_extra"
            control={control}
            rules={{
              required: "El importe es obligatorio",
              min: { value: 0.01, message: "El importe debe ser mayor a 0" },
            }}
            error={errors.valor_hora_extra?.message}
            requiredField
            placeholder="$ 0.00"
            icon={LuBanknote}
            currencySymbol="$"
            locale="es-AR"
          />
        </>
      )}
      <div className="col-span-full  grid grid-cols-2 gap-2">
        <h6 className="border-t border-base-200 mt-4 col-span-full pt-2 pb-4 uppercase font-medium tracking-widest text-xs text-base-500 dark:text-base-300">
          Otros datos
        </h6>
        <Input
          label="Fecha nacimiento"
          type="date"
          {...register("fecha_nacimiento")}
        />
        <PhoneInput
          label="Teléfono"
          value={telefono || ""}
          onChange={(value) =>
            setValue("telefono", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        <Input label="Domicilio" {...register("direccion")} />

        <Select
          label="Seguro"
          {...register("seguro")}
          options={optionsSeguro}
        />
        <div className="self-end">
          <ToggleSwitch
            id="tiene_carnet"
            label={`${watch("tiene_carnet") ? "✅ Tiene carnet" : "❌ No tiene carnet"}`}
            value={watch("tiene_carnet")}
            onCustumChange={(checked) => {
              setValue("tiene_carnet", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("vehiculo", checked ? "" : "no_aplica", {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        </div>
        <MorphingInput
          label="Vehículo"
          name="vehiculo"
          control={control}
          options={optionsvehiculo}
        />
      </div>
      <div className="self-end">
        <ToggleSwitch
          id="alergias"
          label={`${watch("alergias") ? "✅ Tiene alergias" : "❌ No tiene alergias"}`}
          value={watch("alergias")}
          onCustumChange={(checked) => {
            setValue("alergias", checked, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue("tipo_alergia", checked ? "" : "No aplica", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
      </div>
      <Input
        label="Tipo de alergias"
        {...register("tipo_alergia")}
        disabled={!watch("alergias")}
      />
      <PhoneInput
        label="Contacto de emergencias"
        value={contactoEmergencia || ""}
        onChange={(value) =>
          setValue("contacto_emergencia", value, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      />
      <Input label="Siniestro" {...register("siniestros")} />
      <h6 className="border-t border-base-200 mt-4 col-span-full pt-2 pb-4 uppercase font-medium tracking-widest text-xs text-base-500 dark:text-base-300">
        Talles de ropa
      </h6>
      <Input label="Camisa" {...register("talle_camisa")} />
      <Input label="Pantalón" {...register("talle_pantalon")} />
      <Input label="Borcegos" {...register("talle_borcegos")} />
      <div className="self-end">
        <Label>Remera</Label>
        <Controller
          name="talle_remera"
          control={control}
          render={({ field }) => (
            <ButtonGroup className="mt-1 flex" outline>
              {tallesRemera.map((talle) => (
                <Button
                color={"primary"}
                  key={talle}
                  type="button"
                  className={`flex-1 ${
                    field.value === talle
                      ? "bg-primary-600 border-primary-600 text-white"
                      : ""
                  }`}
                  onClick={() => field.onChange(talle)}
                >
                  {talle}
                </Button>
              ))}
            </ButtonGroup>
          )}
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
