import { Input, formatCuit, Select } from "~/components/InputsForm";
import { Button, Card } from "flowbite-react";
import { useEffect, useState } from "react";
import {
  getChequeTransition,
  chequeStateMachine,
} from "~/utils/chequeStateMachine";
import { useForm } from "react-hook-form";
import type {
  Cheque,
  ChequeConSociosYMovimiento,
  MovimientoDetalle,
} from "~/types/cuentas-corrientes";
import { SocioComponentForm } from "~/components/specials/SocioComponent";
import type { SocioComercial } from "~/types/socios";
import { BadgeStatusCheque } from "~/components/specials/Badges";
import { capitalize } from "~/utils/functions";
import { useModal } from "~/context/ModalContext";
import { useAdministracion } from "~/context/AdministracionContext";
import { useParams } from "react-router";
type AccionTypes =
  | "depositar"
  | "endosar"
  | "anular"
  | "acreditar"
  | "rechazar"
  | "anularEndoso";
export default function ChequeForm() {
  const { chequeId } = useParams();
  const { cheques, bancos, updateCheque, createNewMovimiento } =
    useAdministracion();
  const { openModal, closeModal } = useModal();
  const cheque = cheques?.find((c) => c.id === chequeId);
  const [accion, setAccion] = useState<AccionTypes | "">("");
  useEffect(() => { closeModal(); }, []);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: {
      errors,
      isSubmitting,
      dirtyFields,
    },
  } = useForm<ChequeConSociosYMovimiento>({
    defaultValues: cheque,
  });

  const onSubmit = async (formData: ChequeConSociosYMovimiento) => {
    try {
      openModal("loading", { message: "Actualizando cheque..." });
      const currentStatus = cheque?.status as any;
      const transition = getChequeTransition(
        currentStatus,
        accion as AccionTypes,
      );
      const { error } = await updateCheque(formData, dirtyFields);
      if (error) {
        throw new Error(error);
      }
      if (transition && transition.effect === "generarDeuda") {
        const now = new Date();
        const fecha_movimiento = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
        ].join("-");
        const payload = {
          cliente_id: cheque?.movimiento.cliente_id || "",
          fecha_movimiento,
          tipo_movimiento: "deuda",
          origen:
            accion === "rechazar" ? "rechazo_cheque" : "anulacion_movimiento",
          medio_pago: "no_aplica",
          debe: cheque?.importe || 0,
          haber: 0,
          concepto: `Deuda generada por cheque ${cheque?.numero} - ${capitalize(accion)}`,
        };
        const { error: movimientoError } = await createNewMovimiento(
          payload as Omit<MovimientoDetalle, "id">,
        );
        if (movimientoError) {
          throw new Error(
            `Cheque actualizado pero error al generar movimiento de deuda: ${movimientoError}`,
          );
        }
      }
      setAccion("");
      openModal("success", {
        title: "Cheque actualizado",
        message: "El cheque ha sido actualizado exitosamente.",
      });
    } catch (error) {
      openModal("error", {
        title: "Error",
        message: `No se pudo actualizar el cheque: ${error}`,
      });
    }
  };
  // Centraliza la transición de estado usando la máquina de estados
  const handleSetAction = (actionType: AccionTypes) => {
    const currentStatus = cheque?.status as any;
    const transition = getChequeTransition(currentStatus, actionType);
    if (!transition) return;

    const today = new Date().toISOString().split("T")[0];
    // Setea el nuevo estado y campos asociados según la acción
    switch (actionType) {
      case "depositar":
        setValue("fecha_deposito", today, { shouldDirty: true });
        setValue("status", "depositado", { shouldDirty: true });
        setValue("fecha_endoso", undefined);
        setValue("proveedor_id", undefined);
        setValue("fecha_anulacion", undefined);
        break;
      case "endosar":
        setValue("fecha_endoso", today, { shouldDirty: true });
        setValue("status", "endosado", { shouldDirty: true });
        setValue("fecha_deposito", undefined);
        setValue("fecha_anulacion", undefined);
        break;
      case "anular":
        setValue("fecha_anulacion", today, { shouldDirty: true });
        setValue("status", "anulado", { shouldDirty: true });
        setValue("fecha_deposito", undefined);
        setValue("fecha_endoso", undefined);
        setValue("proveedor_id", undefined);
        break;
      case "acreditar":
        setValue("fecha_acreditacion", today, { shouldDirty: true });
        setValue("status", "acreditado", { shouldDirty: true });
        setValue("fecha_rechazo", undefined);
        setValue("motivo_rechazo", undefined);
        break;
      case "rechazar":
        setValue("fecha_rechazo", today, { shouldDirty: true });
        setValue("status", "rechazado", { shouldDirty: true });
        setValue("fecha_acreditacion", undefined);
        break;
      case "anularEndoso":
        // Esta acción se maneja aparte (ver anularEndoso)
        break;
      default:
        break;
    }
    setAccion(actionType);
  };
  const handleBackToReceived = () => {
    openModal("confirmation", {
      props: {
        title: "Confirmar anulación de endoso",
        message:
          "¿Está seguro que desea anular el endoso de este cheque? El cheque volverá a estar recibido/en cartera y se eliminarán los datos del endoso.",
        onConfirm: async () => {
          openModal("loading", { message: "Anulando endoso..." });
          const payload = {
            id: cheque?.id,
            fecha_endoso: "",
            proveedor_id: "",
            status: "en_cartera",
          };
          const { error } = await updateCheque(payload as Cheque, {
            fecha_endoso: true,
            proveedor_id: true,
            status: true,
          });
          if (error) {
            openModal("error", {
              title: "Error",
              message: `No se pudo anular el endoso: ${error}`,
            });
          }
          setAccion("");
          openModal("success", {
            title: "Endoso anulado",
            message: "El endoso ha sido anulado exitosamente.",
          });
        },
      },
    });
  };

  // Type guard para ChequeStatus
  const chequeStatuses = [
    "en_cartera",
    "endosado",
    "depositado",
    "anulado",
    "rechazado",
    "acreditado",
  ] as const;
  type ChequeStatus = (typeof chequeStatuses)[number];
  const statusIsValid = (status: any): status is ChequeStatus =>
    chequeStatuses.includes(status);

  const validActions = statusIsValid(cheque?.status)
    ? Object.keys(chequeStateMachine[cheque.status])
    : [];
  const isEditable = validActions.length > 0;
  return (
    <div className="container mx-auto px-6 lg:px-0">
      <div className="w-full pt-6 flex flex-col items-center max-w-7xl space-y-6 mx-auto">
        <Card className="w-full">
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Razón social
                </p>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {cheque?.cliente.razon_social || "-"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  CUIT: {formatCuit(cheque?.cliente.cuit_cuil || "")}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Estado actual:{" "}
                  </p>
                  <div className="w-fit">
                    <BadgeStatusCheque status={cheque?.status as string} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Importe del cheque
              </span>
              <div
                className={`mt-2 inline-flex items-center px-2 py-1 rounded-xl text-white text-xl font-bold bg-green-600`}
              >
                {cheque?.importe.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </div>
            </div>
          </div>
          {cheque?.status !== "en_cartera" && (
            <>
              <hr className="text-gray-300 dark:text-gray-600" />
              <h2 className="font-medium mb-2 uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Detalles del cheque
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 ">
                  Tipo de cheque:{" "}
                  <strong>{capitalize(cheque?.tipo || "") || "-"}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 ">
                  Banco:{" "}
                  <strong>
                    {bancos?.find((banco) => banco.value === cheque?.banco)
                      ?.label || "-"}
                  </strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 ">
                  Número de cheque: <strong>{cheque?.numero || "-"}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 ">
                  Fecha de pago: <strong>{cheque?.fecha_cobro || "-"}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 ">
                  Fecha de ingreso:{" "}
                  <strong>{cheque?.fecha_ingreso || "-"}</strong>
                </p>
                {cheque?.status === "depositado" && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 ">
                    Fecha de depósito:{" "}
                    <strong>{cheque?.fecha_deposito || "-"}</strong>
                  </p>
                )}
                {cheque?.status === "endosado" && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300 ">
                      Fecha de endoso:{" "}
                      <strong>{cheque?.fecha_endoso || "-"}</strong>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex-2">
                      Destino (Proveedor):{" "}
                      <strong>{cheque?.proveedor?.razon_social || "-"}</strong>
                    </p>
                  </>
                )}
                {cheque?.status === "anulado" && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300 ">
                      Fecha de anulación:{" "}
                      <strong>{cheque?.fecha_anulacion || "-"}</strong>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 ">
                      Motivo de anulación:{" "}
                      <strong>{cheque?.motivo_anulacion || "-"}</strong>
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </Card>
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
          {/* Campos editables generales (siempre que sea editable) */}
          {isEditable && (
            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-5 bg-white dark:bg-gray-800">
              <legend className="px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                ✍️​ Campos editables
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Fecha de pago"
                  type="date"
                  {...register(`fecha_cobro`, {
                    required: "Requerido",
                  })}
                  error={errors.fecha_cobro?.message as string}
                  requiredField={true}
                />
                {bancos && (
                  <Select
                    label="Banco"
                    {...register(`banco`, {
                      required: {
                        value: watch(`tipo`) === "fisico",
                        message: "El banco es obligatorio",
                      },
                    })}
                    error={errors.banco?.message as string}
                    requiredField={watch(`tipo`) === "fisico"}
                    options={bancos}
                  />
                )}
                <Input
                  label="N° Cheque"
                  placeholder="Ej: 123456"
                  {...register(`numero`, {
                    required: "Requerido",
                    valueAsNumber: true,
                  })}
                  error={errors.numero?.message as string}
                  requiredField={true}
                />
                <Input
                  label="Fecha ingreso"
                  type="date"
                  {...register(`fecha_ingreso`, {
                    required: "Requerido",
                  })}
                  error={errors.fecha_ingreso?.message as string}
                  requiredField={true}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Observación"
                    placeholder="Notas adicionales sobre este cheque (opcional)"
                    {...register(`notas`)}
                    error={errors.notas?.message as string}
                  />
                </div>
              </div>
            </fieldset>
          )}
          {/* Acciones disponibles según la máquina de estados */}
          {isEditable && (
            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-lg p-5 bg-white dark:bg-gray-800">
              <legend className="px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                🔀​ Acciones disponibles
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {validActions.includes("depositar") && (
                  <Button
                    color="green"
                    type="button"
                    onClick={() => handleSetAction("depositar")}
                    outline
                    className="focus:ring-0 focus:bg-green-600 focus:text-white"
                  >
                    Depositar
                  </Button>
                )}
                {validActions.includes("endosar") && (
                  <Button
                    color="blue"
                    type="button"
                    onClick={() => handleSetAction("endosar")}
                    outline
                    className="focus:ring-0 focus:bg-blue-600 focus:text-white"
                  >
                    Endosar
                  </Button>
                )}
                {validActions.includes("anular") && (
                  <Button
                    color="red"
                    type="button"
                    onClick={() => handleSetAction("anular")}
                    outline
                    className="focus:ring-0 focus:bg-red-600 focus:text-white"
                  >
                    Anular
                  </Button>
                )}
                {/* Oculta 'Rechazar' si el estado es 'en_cartera' */}
                {validActions.includes("rechazar") &&
                  cheque?.status !== "en_cartera" && (
                    <Button
                      color="red"
                      type="button"
                      onClick={() => handleSetAction("rechazar")}
                      outline
                      className="focus:ring-0 focus:bg-red-600 focus:text-white"
                    >
                      Rechazar
                    </Button>
                  )}
                {validActions.includes("acreditar") && (
                  <Button
                    color="green"
                    type="button"
                    onClick={() => handleSetAction("acreditar")}
                    outline
                    className="focus:ring-0 focus:bg-green-600 focus:text-white"
                  >
                    Acreditar
                  </Button>
                )}
                {/* Anular endoso como acción visible cuando está endosado */}
                {cheque?.status === "endosado" &&
                  validActions.includes("anularEndoso") && (
                    <Button
                      color="yellow"
                      type="button"
                      onClick={handleBackToReceived}
                      outline
                      className="focus:ring-0 focus:bg-yellow-600 focus:text-white"
                    >
                      Anular endoso
                    </Button>
                  )}
              </div>
              {/* Campos adicionales según acción seleccionada */}
              {accion === "depositar" && (
                <Input
                  label="Fecha de deposito"
                  type="date"
                  {...register(`fecha_deposito`, {
                    required: "Requerido",
                  })}
                  error={errors.fecha_deposito?.message as string}
                  requiredField
                />
              )}
              {accion === "endosar" && (
                <div className="flex gap-4">
                  <div className="flex-1">
                  <Input
                    label="Fecha de endoso"
                    type="date"
                    {...register(`fecha_endoso`, {
                      required: "Requerido",
                    })}
                    error={errors.fecha_endoso?.message as string}
                    requiredField
                  /></div>
                  <div className="flex-2">
                    <SocioComponentForm
                      tipoSocio="proveedor"
                      error={errors.proveedor_id?.message as string}
                      value={watch(`proveedor.razon_social`) || ""}
                      onSelect={(proveedor: SocioComercial) => {
                        setValue("proveedor", proveedor, {
                          shouldDirty: true,
                        });
                        setValue("proveedor_id", proveedor.id, {
                          shouldDirty: true,
                        });
                      }}
                    />
                  </div>
                </div>
              )}
              {accion === "anular" && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="Fecha de anulación"
                      type="date"
                      {...register(`fecha_anulacion`, {
                        required: "Requerido",
                      })}
                      error={errors.fecha_anulacion?.message as string}
                      requiredField
                    />
                  </div>
                  <div className="flex-2">
                    <Input
                      label="Motivo de anulación"
                      placeholder="Ingrese el motivo de la anulación del cheque"
                      {...register(`motivo_anulacion`, {
                        required: "Requerido",
                      })}
                      error={errors.motivo_anulacion?.message as string}
                      requiredField
                    />
                  </div>
                </div>
              )}
              {accion === "acreditar" && (
                <Input
                  label="Fecha de acreditación"
                  type="date"
                  {...register(`fecha_acreditacion`, {
                    required: "Requerido",
                  })}
                  error={errors.fecha_acreditacion?.message as string}
                  requiredField
                />
              )}
              {accion === "rechazar" && (
                <div className="flex gap-4">
                  <div className="flex-1">
                  <Input
                    label="Fecha de rechazo"
                    type="date"
                    {...register(`fecha_rechazo`, {
                      required: "Requerido",
                    })}
                    error={errors.fecha_rechazo?.message as string}
                    requiredField
                  /></div>
                  <div className="flex-2">
                    <Input
                      label="Motivo de rechazo"
                      placeholder="Ingrese el motivo del rechazo del cheque"
                      {...register(`motivo_rechazo`, {
                        required: "Requerido",
                      })}
                      error={errors.motivo_rechazo?.message as string}
                      requiredField
                    />
                  </div>
                </div>
              )}
            </fieldset>
          )}
          {isEditable && (
            <div className="w-fit">
              <Button color="violet" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
