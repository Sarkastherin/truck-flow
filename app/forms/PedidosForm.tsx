import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
  Button,
} from "flowbite-react";
import {
  CurrencyInput,
  Input,
  Select,
  Textarea,
} from "~/components/InputsForm";
import FormaPagoForm from "~/forms/FormaPagoForm";
import type { Pedido, PedidoFormValues } from "~/types/pedido";
import { useModal } from "~/context/ModalContext";
import type { SocioComercial } from "~/types/socios";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import { useEffect, useMemo, useState } from "react";
import { usePedido } from "~/context/PedidoContext";
import { useNavigate } from "react-router";
import { statusOptionsPedidos, tipoPedidoOptions } from "~/types/pedido";
import { LuBanknote } from "react-icons/lu";
import { SocioComponentForm } from "~/components/specials/SocioComponent";
import { useFormNavigationBlock } from "~/hooks/useFormNavigationBlock";
import { MODE_DEV } from "~/backend/Database/SheetsConfig";
export default function PedidosForm({ data }: { data?: PedidoFormValues }) {
  const { vendedoresOptions } = useConfiguracion();
  const { openModal } = useModal();
  const { createNewPedido, updatePedido } = usePedido();
  const navigate = useNavigate();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, dirtyFields, isDirty, isSubmitSuccessful },
  } = useForm<PedidoFormValues>({
    defaultValues: data || {
      cliente: {} as SocioComercial,
      cliente_id: "",
      vendedor_id: "",
      status: "nuevo",
      tipo: "nueva",
      fecha_pedido: "",
      fecha_estimada_entrega: "",
      precio: 0,
      formas_pago: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "formas_pago",
    keyName: "fieldId",
  });
  const watchedStatus = useWatch({
    control,
    name: "status",
  });
  const watchedPrecio = useWatch({
    control,
    name: "precio",
  });
  const watchedFormasPago = useWatch({
    control,
    name: "formas_pago",
  });
  const isEditMode = Boolean(watch("id"));

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

  useEffect(() => {
    if (isDraftStatus || paymentsMatchTotal) {
      clearErrors("precio");
    }
  }, [clearErrors, isDraftStatus, paymentsMatchTotal]);

  const onSubmit = async (data: PedidoFormValues) => {
    openModal("loading", {
      props: {
        title: isEditMode ? "Actualizando pedido..." : "Creando pedido...",
      },
    });
    try {
      if (!isEditMode) {
        clearErrors("precio");
        const {
          data: dataInsert,
          error,
          success,
        } = await createNewPedido(data as Pedido);
        if (error) {
          throw new Error(`Error al crear pedido: ${error}`);
        }
        if (success) {
          openModal("success", {
            props: {
              title: "Pedido guardado",
              message: "El pedido se ha guardado con éxito.",
              onClose: () => {
                if (dataInsert?.id) {
                  navigate(`/pedidos/${dataInsert.id}`, {
                    state: { pedido: dataInsert },
                  });
                }
              },
            },
          });
        }
      } else {
        const { formas_pago: dirtyFormasPago, ...dirtyPedidoData } =
          dirtyFields;
        // Verificar si hay cambios en el formulario
        const hasdirtyFieldsPedido =
          dirtyPedidoData && Object.keys(dirtyPedidoData).length > 0;
        const hasdirtyFieldsFormasPago = (dirtyFormasPago?.length ?? 0) > 0;
        const hasDeletedFormasPago = deletedIds.length > 0;
        // Si no hay campos dirty, no actualizar
        if (
          !hasdirtyFieldsPedido &&
          !hasdirtyFieldsFormasPago &&
          !hasDeletedFormasPago
        ) {
          openModal("info", {
            props: {
              title: "Sin cambios",
              message: "No se han detectado cambios para guardar.",
            },
          });
          return;
        }
        const { success, error } = await updatePedido(
          data as Pedido,
          dirtyFields,
          deletedIds,
        );
        if (error) {
          throw new Error(`Error al actualizar pedido: ${error}`);
        }
        if (success) {
          openModal("success", {
            props: {
              title: "Pedido actualizado",
              message: "El pedido se ha actualizado con éxito.",
              onClose: () => {},
            },
          });
        }
      }
    } catch (error) {
      console.error("Error en onSubmit de PedidosForm:", error);
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Ha ocurrido un error desconocido al guardar el pedido.",
        },
      });
    }
  };
  register("cliente_id", {
    required: "El cliente es requerido",
  });
  useFormNavigationBlock<PedidoFormValues>({
    isDirty,
    isSubmitSuccessful,
    dirtyFields,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Información del pedido</AccordionTitle>
          <AccordionContent>
            <fieldset className="grid sm:grid-cols-3 gap-2">
              <Input
                label="Fecha de pedido"
                type="date"
                {...register("fecha_pedido", {
                  required: "La fecha de pedido es requerida",
                })}
                requiredField={true}
                error={errors.fecha_pedido?.message}
              />
              <div className="sm:col-span-2">
                <SocioComponentForm
                  tipoSocio="cliente"
                  error={errors.cliente_id?.message}
                  value={watch(`cliente.razon_social`) || ""}
                  onSelect={(cliente: SocioComercial) => {
                    setValue("cliente_id", cliente.id, { shouldDirty: true });
                    setValue("cliente", cliente, { shouldDirty: true });
                    setValue("vendedor_id", cliente.vendedor_id || "", {
                      shouldDirty: true,
                    });
                  }}
                />
              </div>
              <Select
                label="Vendedor"
                {...register("vendedor_id", {
                  required: "Este campo es requerido",
                })}
                error={errors.vendedor_id?.message}
                requiredField={true}
                options={vendedoresOptions}
                disabledEmptyOption={true}
                emptyOption="Seleccione el vendedor"
              />
              <Select
                label={!isEditMode ? "🔒 Status" : "Status"}
                {...register("status", {
                  required: "Este campo es requerido",
                })}
                disabled={!isEditMode}
                error={errors.status?.message}
                requiredField={true}
                options={statusOptionsPedidos}
                emptyOption="Seleccione el status"
              />
              <Select
                label="Tipo de pedido"
                {...register("tipo", {
                  required: "Este campo es requerido",
                })}
                error={errors.tipo?.message}
                requiredField={true}
                options={tipoPedidoOptions}
                emptyOption="Tipo de pedido"
                disabled={!MODE_DEV}
              />
            </fieldset>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
      <Accordion alwaysOpen>
        <AccordionPanel>
          <AccordionTitle>Condiciones de pago</AccordionTitle>
          <AccordionContent className="space-y-4">
            <fieldset className="grid sm:grid-cols-2 gap-2">
              <Input
                label="Fecha prevista"
                type="date"
                {...register("fecha_estimada_entrega")}
              />
              <CurrencyInput
                label="Precio total"
                name="precio"
                control={control}
                rules={{
                  required: "Este campo es requerido",
                  min: {
                    value: 0.01,
                    message: "El precio total debe ser mayor a cero",
                  },
                }}
                error={errors.precio?.message}
                requiredField={true}
                placeholder="$ 0,00"
                icon={LuBanknote}
                currencySymbol="$"
                locale="es-AR"
              />
            </fieldset>
            <FormaPagoForm
              watchedPrecio={watchedPrecio}
              watchedFormasPago={watchedFormasPago || []}
              watchedStatus={watchedStatus}
              register={register}
              watch={watch}
              errors={errors}
              control={control}
              append={append}
              fields={fields}
              remove={remove}
              setDeletedIds={setDeletedIds}
            />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
      <Textarea
        label="Observaciones"
        placeholder="Observaciones adicionales sobre el pedido"
        {...register("notas")}
        error={errors.notas?.message}
      />
      <div className="space-y-2">
        {!isDraftStatus && !paymentsMatchTotal && (
          <p className="text-right text-sm text-red-600 dark:text-red-400">
            Ajusta las formas de pago para que coincidan con el precio total
            antes de guardar.
          </p>
        )}
        <Button type="submit" className="ml-auto block" disabled={false}>
          Guardar pedido
        </Button>
      </div>
    </form>
  );
}
