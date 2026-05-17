import { Button } from "flowbite-react";
import { useMemo } from "react";
import { Input, Select, CurrencyInput } from "~/components/InputsForm";
import {
  formaPagoOptions,
  type FormaPagoFormValues,
  type PedidoFormValues,
} from "~/types/pedido";
import type { StatusPedido } from "~/types/pedido";
import type {
  UseFormRegister,
  UseFieldArrayReturn,
  FieldErrors,
  Control,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import { LuBanknote, LuTrash2, LuTruck } from "react-icons/lu";
import { useModal } from "~/context/ModalContext";
import { AddCarroceriaUsada } from "~/components/modals/customs/AddCarroceriaUsada";
import { useCarroceriaUsada } from "~/hooks/useCarroceriaUsada";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import { useNavigate } from "react-router";
import { useUser } from "~/context/UserContext";
import { SeleccionarCarroceriaModal } from "~/components/modals/customs/SeleccionarCarroceriaModal";

export default function FormaPagoForm({
  watchedPrecio,
  watchedFormasPago,
  watchedStatus,
  register,
  watch,
  errors,
  control,
  append,
  fields,
  setDeletedIds,
  remove,
  clienteId,
  setValue,
}: {
  watchedPrecio: number;
  watchedFormasPago: FormaPagoFormValues[];
  watchedStatus: StatusPedido;
  register: UseFormRegister<PedidoFormValues>;
  watch: UseFormWatch<PedidoFormValues>;
  errors: FieldErrors<PedidoFormValues>;
  control: Control<PedidoFormValues>;
  append: UseFieldArrayReturn<
    PedidoFormValues,
    "formas_pago",
    "fieldId"
  >["append"];
  fields: UseFieldArrayReturn<
    PedidoFormValues,
    "formas_pago",
    "fieldId"
  >["fields"];
  remove: UseFieldArrayReturn<
    PedidoFormValues,
    "formas_pago",
    "fieldId"
  >["remove"];
  setDeletedIds: React.Dispatch<React.SetStateAction<string[]>>;
  clienteId: string;
  setValue: UseFormSetValue<PedidoFormValues>;
}) {
  const { openModal, closeModal } = useModal();
  const navigate = useNavigate();
  const { form, onCreate } = useCarroceriaUsada();
  const totalPrecio = Number(watchedPrecio) || 0;
  const totalAsignado = useMemo(
    () =>
      (watchedFormasPago || []).reduce(
        (accumulator, formaPago) =>
          accumulator + (Number(formaPago?.monto) || 0),
        0,
      ),
    [watchedFormasPago],
  );
  const diferenciaPago = Number((totalPrecio - totalAsignado).toFixed(2));
  const paymentsMatchTotal = Math.abs(diferenciaPago) < 0.01;
  const isDraftStatus = watchedStatus === "incompleto";
  const summaryTone = paymentsMatchTotal
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
    : diferenciaPago > 0
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300";
  const paymentStatusLabel = paymentsMatchTotal
    ? "Pagos completos"
    : diferenciaPago > 0
      ? "Saldo pendiente"
      : "Pagos excedidos";
  const appendPayment = () => {
    const remainingAmount = Number(Math.max(diferenciaPago, 0).toFixed(2));
    append({
      tipo: "",
      descripcion: "",
      monto: remainingAmount,
      carroceria_usada_id: "",
    });
  };
  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
      }),
    [],
  );
  const handleRemoveFormaPago = (index: number) => {
    const formaPago = watch(`formas_pago.${index}`);

    if (formaPago?.id) {
      setDeletedIds((current) =>
        current.includes(formaPago.id!) ? current : [...current, formaPago.id!],
      );
    }

    remove(index);
  };
  const handleAddCarroceria = (index: number) => {
    const newForm = form;
    newForm.reset({
      tipo_carrozado: "",
      marca_carroceria: "",
      anno_fabricacion: null,
      color: "",
      duenno_id: clienteId,
      precio_lista: undefined,
      tasacion: watch(`formas_pago.${index}.monto`),
      status: "disponible",
    });
    openModal("form", {
      component: AddCarroceriaUsada,
      props: {
        form: newForm,
        title: "Registrar carrocería usada",
        size: "2xl",
      },
      onSubmit: form.handleSubmit((data: CarroceriaUsadaData) =>
        handleCreateCarroceriaUsada(data, index),
      ),
    });
  };
  const handleAsignedCarroceria = (index: number) => {
    openModal("custom", {
      title: "Seleccionar Carrocería Usada",
      component: SeleccionarCarroceriaModal,
      mode: "asignacion",
      clienteId,
      onSelect: (item: CarroceriaUsadaData) => {
        handleSelectCarroceriaUsada(item, index);
      },
      size: "4xl",
    });
  };
  const handleSelectCarroceriaUsada = (item: CarroceriaUsadaData, index: number) => {
    setValue(`formas_pago.${index}.carroceria_usada_id`, item.id, {
      shouldDirty: true,
    });
    setValue(`formas_pago.${index}.monto`, item.tasacion, {
      shouldDirty: true,
    });
    closeModal();
  };
  const handleCreateCarroceriaUsada = async (
    data: CarroceriaUsadaData,
    index: number,
  ) => {
    const result = await onCreate(data);
    if (result) {
      setValue(`formas_pago.${index}.carroceria_usada_id`, result.id, {
        shouldDirty: true,
      });
    }
  };
  return (
    <div>
      <div className={`rounded-xl border p-4 ${summaryTone}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Resumen de pagos</p>
            <p className="text-sm opacity-90">
              {isDraftStatus
                ? "En estado incompleto puedes guardar aunque exista diferencia, pero para avanzar el pedido los importes deben cuadrar."
                : "Para guardar un pedido operativo, la suma de las formas de pago debe coincidir con el precio total."}
            </p>
          </div>
          {!paymentsMatchTotal && diferenciaPago > 0 && (
            <Button
              type="button"
              size="xs"
              color="light"
              onClick={appendPayment}
            >
              Cargar saldo restante
            </Button>
          )}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30">
            <p className="text-xs uppercase tracking-wide opacity-70">
              Precio total
            </p>
            <p className="mt-1 text-base font-semibold">
              {formatCurrency.format(totalPrecio)}
            </p>
          </div>
          <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30">
            <p className="text-xs uppercase tracking-wide opacity-70">
              Total asignado
            </p>
            <p className="mt-1 text-base font-semibold">
              {formatCurrency.format(totalAsignado)}
            </p>
          </div>
          <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30">
            <p className="text-xs uppercase tracking-wide opacity-70">
              {diferenciaPago >= 0 ? "Saldo pendiente" : "Excedente"}
            </p>
            <p className="mt-1 text-base font-semibold">
              {formatCurrency.format(Math.abs(diferenciaPago))}
            </p>
          </div>
          <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/30">
            <p className="text-xs uppercase tracking-wide opacity-70">Estado</p>
            <p className="mt-1 text-base font-semibold">{paymentStatusLabel}</p>
          </div>
        </div>
      </div>
      <fieldset className="mt-4 space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              No hay formas de pago agregadas
            </p>
            {diferenciaPago > 0 && (
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                La primera forma de pago se precargará con{" "}
                {formatCurrency.format(diferenciaPago)}.
              </p>
            )}
            <Button
              type="button"
              size="sm"
              color="light"
              className="mx-auto"
              onClick={appendPayment}
            >
              Agregar primera forma de pago
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.fieldId}
                className="grid grid-cols-1 lg:grid-cols-6 gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:shadow-md transition-shadow"
              >
                <div className="col-span-6 lg:col-span-2">
                  <Select
                    label="Tipo"
                    {...register(`formas_pago.${index}.tipo` as const, {
                      required: "Este campo es requerido",
                    })}
                    error={errors.formas_pago?.[index]?.tipo?.message}
                    requiredField={true}
                    options={formaPagoOptions}
                    emptyOption="Método de pago"
                  />
                </div>
                <div className="col-span-6 lg:col-span-4">
                  <Input
                    label="Descripción"
                    placeholder="Descripción (opcional)"
                    {...register(`formas_pago.${index}.descripcion` as const)}
                    error={errors.formas_pago?.[index]?.descripcion?.message}
                  />
                </div>
                <div className="col-span-6 lg:col-span-2">
                  <CurrencyInput
                    label="Monto"
                    name={`formas_pago.${index}.monto` as const}
                    control={control}
                    rules={{
                      required: "Este campo es requerido",
                    }}
                    error={errors.formas_pago?.[index]?.monto?.message}
                    requiredField={true}
                    placeholder="$ 0,00"
                    icon={LuBanknote}
                    currencySymbol="$"
                    locale="es-AR"
                  />
                </div>
                <div className="mt-2 lg:mt-0 col-span-6 lg:col-span-4 flex justify-center items-end gap-2">
                  {watch(`formas_pago.${index}.carroceria_usada_id`) ? (
                    <Button
                      className="w-full"
                      color={"blue"}
                      outline
                      onClick={() =>
                        navigate(
                          `/carrocerias-usadas/${watch(`formas_pago.${index}.carroceria_usada_id`)}`,
                        )
                      }
                      disabled={watch(`formas_pago.${index}.tipo`) !== "carroceria_usada"}
                    >
                      Carroceria registrada
                    </Button>
                  ) : (
                    <div className="w-full grid grid-cols-2 gap-2">
                      <Button
                        className="w-full py-5"
                        color={`${watch(`formas_pago.${index}.tipo`) !== "carroceria_usada" ? "gray" : "lime"}`}
                        outline
                        onClick={() => handleAddCarroceria(index)}
                        size="sm"
                        disabled={watch(`formas_pago.${index}.tipo`) !== "carroceria_usada"}
                      >
                        Registrar carroceria usada
                      </Button>
                      <Button
                        className="w-full py-5"
                        color={`${watch(`formas_pago.${index}.tipo`) !== "carroceria_usada" ? "gray" : "yellow"}`}
                        outline
                        size="sm"
                        onClick={() => handleAsignedCarroceria(index)}
                        disabled={watch(`formas_pago.${index}.tipo`) !== "carroceria_usada"}
                      >
                        Asignar desde stock
                      </Button>
                    </div>
                  )}
                  <Button
                    type="button"
                    color="red"
                    onClick={() => handleRemoveFormaPago(index)}
                    className="px-3 "
                    title="Eliminar forma de pago"
                  >
                    <LuTrash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={appendPayment}
              className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                + Agregar otra forma de pago
              </span>
              {diferenciaPago > 0 && (
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  Se completará con el saldo pendiente de{" "}
                  {formatCurrency.format(diferenciaPago)}.
                </span>
              )}
            </button>
          </div>
        )}
      </fieldset>
    </div>
  );
}
