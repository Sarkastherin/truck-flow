import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import type {
  Control,
  FieldArrayPath,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  UseFormClearErrors,
} from "react-hook-form";
import type { ControlCarrozadoForm } from "~/routes/pedidos/$controlesCalidadId_Dev";
import type { ControlCarrozado } from "~/types/Configuraciones";
import type { PedidoFormValues } from "~/types/pedido";
import { atributosConMetadata } from "~/types/pedido";
import { Textarea, ToggleSwitch } from "~/components/InputsForm";
import { HelperText, Toast, ToastToggle } from "flowbite-react";
import { HiExclamation } from "react-icons/hi";
export function ControlCarrozadoForm({
  register,
  setValue,
  control,
  controlCarrozadoData,
  pedido,
  watch,
  errors,
  clearErrors,
}: {
  register: UseFormRegister<ControlCarrozadoForm>;
  setValue: UseFormSetValue<ControlCarrozadoForm>;
  control: Control<ControlCarrozadoForm>;
  controlCarrozadoData: ControlCarrozado[];
  pedido: PedidoFormValues;
  watch: UseFormWatch<ControlCarrozadoForm>;
  errors: FieldErrors<ControlCarrozadoForm>;
  clearErrors: UseFormClearErrors<ControlCarrozadoForm>;
}) {
  const [showObservaciones, setShowObservaciones] = useState<
    Record<number, boolean>
  >({});

  const { fields } = useFieldArray({
    control,
    name: "control_carrozado" as FieldArrayPath<ControlCarrozadoForm>,
  });
  const handleToggleResultado = (
    index: number,
    result: "ok" | "nc" | "reparo",
    checked: boolean,
  ) => {
    setValue(`control_carrozado.${index}.resultado`, checked ? result : null);
    clearErrors(`control_carrozado.${index}.resultado`); // limpiar error
  };
  const orderedFields = fields
    .map((field, index) => {
      const itemControl = controlCarrozadoData.find(
        (ccd) => ccd.item_control.id === field.item_control_id,
      );
      return {
        field,
        itemControl,
        order: itemControl?.order ?? 0,
        originalIndex: index,
      };
    })
    .sort((a, b) => a.order - b.order);
  return (
    <>
      <h3 className="my-6 text-lg font-semibold text-gray-700 dark:text-white">
        Ítems de Control
      </h3>
      <div className="flex flex-col gap-4">
        {orderedFields.map(({ field, itemControl, originalIndex }) => {
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
          const result = {
            ...register(`control_carrozado.${originalIndex}.resultado`, {
              required: {
                value: true,
                message: "🚨 El ítem debe ser evaluado",
              },
            }),
          };
          const error =
            errors.control_carrozado?.[originalIndex]?.resultado?.message;

          return (
            <div
              key={field.id}
              className={`border 
                ${
                  error
                    ? "border-2 border-red-500"
                    : watch(`control_carrozado.${originalIndex}.resultado`) ===
                        "ok"
                      ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/50"
                      : watch(
                            `control_carrozado.${originalIndex}.resultado`,
                          ) === "nc"
                        ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                        : watch(
                              `control_carrozado.${originalIndex}.resultado`,
                            ) === "reparo"
                          ? "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/30"
                          : watch(
                                `control_carrozado.${originalIndex}.resultado`,
                              ) === null
                            ? "border-gray-200 dark:border-gray-600"
                            : ""
                }  rounded-lg p-4 flex flex-col gap-3`}
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
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <ToggleSwitch
                    label="OK"
                    value={
                      watch(`control_carrozado.${originalIndex}.resultado`) ===
                      "ok"
                    }
                    onCustumChange={(checked) =>
                      handleToggleResultado(originalIndex, "ok", checked)
                    }
                  />
                  <ToggleSwitch
                    label="NC"
                    value={
                      watch(`control_carrozado.${originalIndex}.resultado`) ===
                      "nc"
                    }
                    onCustumChange={(checked) =>
                      handleToggleResultado(originalIndex, "nc", checked)
                    }
                  />
                  <ToggleSwitch
                    label="Reparó"
                    value={
                      watch(`control_carrozado.${originalIndex}.resultado`) ===
                      "reparo"
                    }
                    onCustumChange={(checked) =>
                      handleToggleResultado(originalIndex, "reparo", checked)
                    }
                  />
                </div>
                <HelperText className="text-red-600 dark:text-red-400 font-semibold">
                  {error}
                </HelperText>
              </div>
              {watch(`control_carrozado.${originalIndex}.resultado`) ===
              "ok" ? (
                <>
                  {showObservaciones[originalIndex] ? (
                    <div className="flex flex-col gap-1">
                      <Textarea
                        label="Observaciones"
                        {...register(
                          `control_carrozado.${originalIndex}.observaciones`,
                        )}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowObservaciones((prev) => ({
                            ...prev,
                            [originalIndex]: false,
                          }))
                        }
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 self-end"
                      >
                        ✕ Cerrar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setShowObservaciones((prev) => ({
                          ...prev,
                          [originalIndex]: true,
                        }))
                      }
                      className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 border border-violet-300 dark:border-violet-700 rounded px-2 py-1 self-start"
                    >
                      📝 Obs.
                    </button>
                  )}
                </>
              ) : (
                <>
                  {watch(`control_carrozado.${originalIndex}.resultado`) !==
                  null ? (
                    <Textarea
                      label="Observaciones"
                      {...register(
                        `control_carrozado.${originalIndex}.observaciones`,
                      )}
                    />
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(errors).length > 0 && (
        <div className="fixed bottom-0 left-5">
          <Toast>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200">
              <HiExclamation className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              Faltan ítems por evaluar
            </div>
            <ToastToggle />
          </Toast>
        </div>
      )}
    </>
  );
}
