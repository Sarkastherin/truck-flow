import { useFieldArray } from "react-hook-form";
import type { Control, FieldArrayPath, UseFormRegister } from "react-hook-form";
import type { ControlCarrozadoForm } from "~/routes/pedidos/$controlesCalidadId_Dev";
import type { ControlCarrozado } from "~/types/Configuraciones";
import type { PedidoFormValues } from "~/types/pedido";
import { atributosConMetadata } from "~/types/pedido";
import { ToggleSwitch } from "~/components/InputsForm";
export function ControlCarrozadoForm({
  register,
  control,
  controlCarrozadoData,
  pedido,
}: {
  register: UseFormRegister<ControlCarrozadoForm>;
  control: Control<ControlCarrozadoForm>;
  controlCarrozadoData: ControlCarrozado[];
  pedido: PedidoFormValues;
}) {
  const { fields } = useFieldArray({
    control,
    name: "control_carrozado" as FieldArrayPath<ControlCarrozadoForm>,
  });
  const handleToggleResultado = (
    index: number,
    result: "ok" | "nc" | "reparo",
  ) => {};
  return (
    <>
      <h3 className="my-6 text-lg font-semibold text-gray-700 dark:text-white">
        Ítems de Control
      </h3>
      <div className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const itemControl = controlCarrozadoData.find(
            (ccd) => ccd.item_control.id === field.item_control_id,
          );
          const valueAtributo =
            pedido?.carroceria?.[
              itemControl?.item_control
                .atributo_relacionado as keyof typeof pedido.carroceria
            ] ??
            pedido?.camion?.[
              itemControl?.item_control
                .atributo_relacionado as keyof typeof pedido.camion
            ];
          const unit = atributosConMetadata.find(
            (atr) =>
              atr.value === itemControl?.item_control.atributo_relacionado,
          )?.unit;
          return (
            <div
              key={field.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-bold text-sm">
                    {itemControl?.order}
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {itemControl?.item_control.nombre}
                  </span>
                </div>
                {valueAtributo && (
                  <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                    {valueAtributo} {unit}
                  </span>
                )}
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <ToggleSwitch
                    label="OK"
                    value={false}
                    onCustumChange={() => handleToggleResultado(index, "ok")}
                  />
                  <ToggleSwitch
                    label="NC"
                    value={false}
                    onCustumChange={() => handleToggleResultado(index, "nc")}
                  />
                  <ToggleSwitch
                    label="Reparó"
                    value={false}
                    onCustumChange={() =>
                      handleToggleResultado(index, "reparo")
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
