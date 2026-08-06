import { useState, useMemo, useEffect } from "react";
import {
  useWatch,
  type UseFormReturn,
  type UseFieldArrayReturn,
} from "react-hook-form";
import {
  FileInputComponent,
  type FileTypeActions,
} from "~/components/FileInputComponent";
import type { MovimientoFormValues } from "~/types/cuentas-corrientes";
import type { Documento } from "~/types/cuentas-corrientes";
import {
  Input,
  Select,
  Textarea,
  CurrencyInput,
} from "~/components/InputsForm";
import {
  optionMediosPago,
  optionsTipoCheque,
} from "~/types/cuentas-corrientes";
import { LuBanknote, LuDollarSign, LuTrash2 } from "react-icons/lu";
import { Button } from "flowbite-react";
import { useAdministracion } from "~/context/AdministracionContext";
export default function AddMovimiento({
  props,
}: {
  props: {
    title: string;
    form: UseFormReturn<MovimientoFormValues>;
    fieldArrayCheques: UseFieldArrayReturn<MovimientoFormValues, "cheques">;
    fieldArrayDocumentos: UseFieldArrayReturn<
      MovimientoFormValues,
      "documentos"
    >;
    isEfectivo?: boolean;
    files: FileTypeActions<Documento>;
    setFiles: React.Dispatch<React.SetStateAction<FileTypeActions<Documento>>>;
  };
}) {
  const {
    form,
    fieldArrayCheques,
    isEfectivo,
    files,
    setFiles,
  } = props;
  const { getBancos, bancos } = useAdministracion();
  const chequeFields = fieldArrayCheques.fields;

  const [totalCheques, setTotalCheques] = useState<number>(0);
  const cheques =
    useWatch({
      control: form.control,
      name: "cheques",
    }) ?? [];
  const chequeRows = cheques.map((cheque, index) => ({
    ...chequeFields[index],
    ...cheque,
    id: chequeFields[index]?.id ?? `cheque-${index}`,
  }));
  const ultimaFechaIngreso = cheques.at(-1)?.fecha_ingreso;
  const selectBTWDebeHaber = useMemo(() => {
    return form.watch("tipo_movimiento") === "deuda" ? "debe" : "haber";
  }, [form.watch("tipo_movimiento")]);

  useEffect(() => {
    const total = cheques.reduce(
      (acc, cheque) => acc + (Number(cheque?.importe) || 0),
      0,
    );
    setTotalCheques(total);
  }, [cheques]);
  useEffect(() => {
    if (form.watch("medio_pago") !== "cheque") return;
    form.setValue("haber", totalCheques, { shouldDirty: true });
  }, [totalCheques, form]);

  useEffect(() => {
    if (!bancos) {
      getBancos();
    }
  }, [getBancos, bancos]);
  const handleAddCheque = () => {
    if (!ultimaFechaIngreso) return;
    fieldArrayCheques.append({
      movimiento_id: "",
      tipo: "",
      banco: "",
      numero: undefined,
      importe: 0,
      fecha_ingreso: ultimaFechaIngreso,
      fecha_cobro: "",
      status: "en_cartera" as const,
      notas: "",
    });
  };
  const mediosPagosEfectivo = useMemo(() => {
    return optionMediosPago.filter(
      (option) =>
        option.value === "efectivo" || option.value === "transferencia",
    );
  }, [optionMediosPago]);
  const renderRegularForm = () => {
    return (
      <fieldset className="border-t border-gray-300 dark:border-gray-600 pt-5" disabled={form.formState.isSubmitting}>
        <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          📅 Información del Movimiento
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-end gap-4">
          <Input
            label="Fecha de movimiento"
            type="date"
            {...form.register("fecha_movimiento", {
              required: "La fecha de movimiento es obligatoria",
            })}
            error={form.formState.errors.fecha_movimiento?.message as string}
            requiredField={true}
          />
          <Select
            label="Medio de pago"
            {...form.register("medio_pago", {
              required: "El medio de pago es obligatorio",
            })}
            error={form.formState.errors.medio_pago?.message as string}
            requiredField={true}
            options={isEfectivo ? mediosPagosEfectivo : optionMediosPago}
            disabled={!isEfectivo}
          />
          {selectBTWDebeHaber === "debe" ? (
            <CurrencyInput
              label="Importe [DEBE]"
              name={"debe"}
              control={form.control}
              rules={{
                required: "El importe es obligatorio",
                min: { value: 0.01, message: "El importe debe ser mayor a 0" },
              }}
              error={form.formState.errors.debe?.message as string}
              requiredField
              placeholder="$ 0.00"
              icon={LuBanknote}
              currencySymbol="$"
              locale="es-AR"
            />
          ) : (
            <CurrencyInput
              label="Importe [HABER]"
              name={"haber"}
              control={form.control}
              rules={{
                required: "El importe es obligatorio",
                min: { value: 0.01, message: "El importe debe ser mayor a 0" },
              }}
              error={form.formState.errors.haber?.message as string}
              requiredField
              placeholder="$ 0.00"
              icon={LuBanknote}
              currencySymbol="$"
              locale="es-AR"
            />
          )}
        </div>
      </fieldset>
    );
  };
  const renderChequesForm = () => {
    return (
      <div className="space-y-4">
        {/* Sección 1: Datos del Movimiento */}
        <fieldset className="border-t border-gray-300 dark:border-gray-600 pt-5" disabled={form.formState.isSubmitting}>
          <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            📅 Información del Movimiento
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              label="Fecha de movimiento"
              type="date"
              {...form.register("fecha_movimiento", {
                required: "La fecha es obligatoria",
              })}
              error={form.formState.errors.fecha_movimiento?.message as string}
              requiredField={true}
            />
            <div className="md:col-span-3 w-full bg-linear-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-lg p-2 shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LuDollarSign className="w-6 h-6" />
                  <div>
                    <p className="text-xs font-medium opacity-90">
                      Total a pagar
                    </p>
                    <p className="text-2xl font-bold">
                      $
                      {totalCheques.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{chequeRows.length}</p>
                  <p className="text-xs opacity-90">
                    cheque{chequeRows.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
        {/* Sección 2: Lista de Cheques */}
        <fieldset className="border-t border-gray-300 dark:border-gray-600 pt-5" disabled={form.formState.isSubmitting}>
          <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            💳 Cheques a registrar
          </legend>
          {/* Cards de cheques */}
          <div className="space-y-3">
            {chequeRows.map((field, index) => (
              <div
                key={field.id}
                className="bg-blue-100/20 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-600 rounded-lg p-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-600">
                  <div className="font-bold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-4">
                    <span>Cheque #{index + 1}</span>
                  </div>
                  {chequeRows.length > 1 && (
                    <div className="w-fit">
                      <Button
                        type="button"
                        color="red"
                        onClick={() => fieldArrayCheques.remove(index)}
                        className="px-3 "
                        title="Eliminar forma de pago"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-4">
                  <Select
                    sizing={"sm"}
                    label="Tipo de cheque"
                    {...form.register(`cheques.${index}.tipo`, {
                      required: "Debe seleccionar un tipo",
                    })}
                    error={
                      form.formState.errors.cheques?.[index]?.tipo
                        ?.message as string
                    }
                    emptyOption="Tipo de cheque"
                    requiredField={true}
                    options={optionsTipoCheque}
                  />
                  <Input
                    sizing={"sm"}
                    label="Fecha de pago"
                    type="date"
                    {...form.register(`cheques.${index}.fecha_cobro`, {
                      required: "Requerido",
                    })}
                    error={
                      form.formState.errors.cheques?.[index]?.fecha_cobro
                        ?.message as string
                    }
                    requiredField={true}
                    disabled={!form.watch(`cheques.${index}.tipo`)}
                  />
                  {bancos && (
                    <div className="md:col-span-2">
                      <Select
                        sizing={"sm"}
                        label="Banco"
                        {...form.register(`cheques.${index}.banco`, {
                          required: {
                            value:
                              form.watch(`cheques.${index}.tipo`) === "fisico",
                            message: "El banco es obligatorio",
                          },
                        })}
                        error={
                          Array.isArray(form.formState.errors.cheques)
                            ? form.formState.errors.cheques[index]?.banco
                                ?.message
                            : undefined
                        }
                        requiredField={
                          form.watch(`cheques.${index}.tipo`) === "fisico"
                        }
                        options={bancos}
                        disabled={!form.watch(`cheques.${index}.tipo`)}
                      />
                    </div>
                  )}
                  <Input
                    sizing={"sm"}
                    label="N° Cheque"
                    placeholder="Ej: 123456"
                    {...form.register(`cheques.${index}.numero`, {
                      required: "Requerido",
                      valueAsNumber: true,
                    })}
                    error={
                      form.formState.errors.cheques?.[index]?.numero
                        ?.message as string
                    }
                    requiredField={true}
                    disabled={!form.watch(`cheques.${index}.tipo`)}
                  />
                  <CurrencyInput
                    sizing={"sm"}
                    label="Importe"
                    name={`cheques.${index}.importe`}
                    control={form.control}
                    rules={{
                      required: "El importe es obligatorio",
                      min: {
                        value: 0.01,
                        message: "El importe debe ser mayor a 0",
                      },
                    }}
                    error={
                      form.formState.errors.cheques?.[index]?.importe
                        ?.message as string
                    }
                    requiredField
                    placeholder="$ 0.00"
                    icon={LuBanknote}
                    currencySymbol="$"
                    locale="es-AR"
                    disabled={!form.watch(`cheques.${index}.tipo`)}
                  />
                  <Input
                    sizing={"sm"}
                    label="Fecha ingreso"
                    type="date"
                    {...form.register(`cheques.${index}.fecha_ingreso`, {
                      required: "Requerido",
                    })}
                    error={
                      form.formState.errors.cheques?.[index]?.fecha_ingreso
                        ?.message as string
                    }
                    requiredField={true}
                    disabled={!form.watch(`cheques.${index}.tipo`)}
                  />
                  <div className="md:col-span-4 lg:col-span-3">
                    <Input
                      sizing={"sm"}
                      label="Observación"
                      placeholder="Notas adicionales sobre este cheque (opcional)"
                      {...form.register(`cheques.${index}.notas`)}
                      error={
                        form.formState.errors.cheques?.[index]?.notas
                          ?.message as string
                      }
                      disabled={!form.watch(`cheques.${index}.tipo`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddCheque}
            className="mt-4 w-full p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!ultimaFechaIngreso}
          >
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              {`${ultimaFechaIngreso ? "+ Agregar otro cheque" : "Cargue la fecha de ingreso del último cheque para agregar otro"}`}
            </span>
          </button>
        </fieldset>
      </div>
    );
  };
  return (
    <>
      {form.watch("medio_pago") === "cheque"
        ? renderChequesForm()
        : renderRegularForm()}
      <fieldset className="border-t border-gray-300 dark:border-gray-600 pt-5" disabled={form.formState.isSubmitting}>
        <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          📝 Detalles Adicionales
        </legend>
        <div className="flex flex-col gap-2">
          <FileInputComponent
            tipoDocumento="movimiento"
            documentos={form.watch("documentos")}
            setFiles={setFiles}
            files={files}
          />
          <Textarea
            label="Concepto / Detalle del movimiento"
            placeholder="Describa el motivo o concepto del movimiento"
            {...form.register("concepto", {
              required: {
                value:
                  form.watch("medio_pago") === "no_aplica" &&
                  form.watch("tipo_movimiento") === "pago",
                message:
                  "El concepto es obligatorio cuando el medio de pago sea 'No aplica'",
              },
            })}
            error={form.formState.errors.concepto?.message as string}
            requiredField={form.watch("medio_pago") === "no_aplica"}
          />
        </div>
      </fieldset>
    </>
  );
}
