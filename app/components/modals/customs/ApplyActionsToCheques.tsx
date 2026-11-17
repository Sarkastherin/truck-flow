import { useState, type ComponentProps } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "flowbite-react";
import { Input, SelectWithSearch } from "~/components/InputsForm";
import { BadgeStatusCheque } from "~/components/specials/Badges";
import {
  chequeStateMachine,
  type ChequeAction,
} from "~/utils/chequeStateMachine";
import type {
  BulkChequeActionValues,
  ChequeConSociosYMovimiento,
  ChequeStatus,
} from "~/types/cuentas-corrientes";
import { useSociosComercial } from "~/context/SociosComercialesContext";
import { formatCurrency, formatDateUStoES } from "~/utils/formats";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { getFieldError } from "~/utils/formFieldHelpers";

type BtnColor = ComponentProps<typeof Button>["color"];

interface Props {
  title: string;
  form: UseFormReturn<BulkChequeActionValues>;
  cheques: ChequeConSociosYMovimiento[];
  size?: string;
}

const accionConfig: Record<
  ChequeAction,
  { label: string; color: BtnColor; fechaLabel?: string }
> = {
  depositar: {
    label: "Depositar",
    color: "green",
    fechaLabel: "Fecha de depósito",
  },
  endosar: {
    label: "Endosar",
    color: "blue",
    fechaLabel: "Fecha de endoso",
  },
  anular: {
    label: "Anular",
    color: "red",
    fechaLabel: "Fecha de anulación",
  },
  rechazar: {
    label: "Rechazar",
    color: "red",
    fechaLabel: "Fecha de rechazo",
  },
  acreditar: {
    label: "Acreditar",
    color: "green",
    fechaLabel: "Fecha de acreditación",
  },
  anularEndoso: { label: "Anular endoso", color: "yellow" },
};

export default function ApplyActionsToCheques({ props }: { props: Props }) {
  const { form, cheques } = props;
  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const { socios } = useSociosComercial();
  const [showCheques, setShowCheques] = useState(false);
  const accion = watch("accion");
  const proveedorId = watch("proveedor_id");
  const status = (cheques[0]?.status ?? "en_cartera") as ChequeStatus;
  const validActions = (
    Object.keys(chequeStateMachine[status] ?? {}) as ChequeAction[]
  ).filter(
    (action) => !(status === "en_cartera" && action === "rechazar"),
  );
  const total = cheques.reduce(
    (acc, cheque) => acc + (Number(cheque.importe) || 0),
    0,
  );
  const proveedores = (socios ?? [])
    .filter((socio) => socio.tipo === "proveedor" && socio.active !== false)
    .map((socio) => ({ id: String(socio.id), name: socio.razon_social }));
  const proveedorNombre =
    proveedores.find((proveedor) => proveedor.id === String(proveedorId))
      ?.name ?? "";
  const config = accion ? accionConfig[accion as ChequeAction] : undefined;
  const needsMotivo = accion === "anular" || accion === "rechazar";

  const handleSelectAccion = (action: ChequeAction) => {
    setValue("accion", action, { shouldDirty: true });
    form.clearErrors();
  };

  return (
    <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-950/40">
        <span className="flex items-center gap-2 font-medium text-green-700 dark:text-green-300">
          {cheques.length} cheque{cheques.length === 1 ? "" : "s"}{" "}
          seleccionado{cheques.length === 1 ? "" : "s"}
          <span className="text-base-600 dark:text-base-300">
            Estado actual:
          </span>
          <BadgeStatusCheque status={status} />
        </span>
        <span className="text-base-600 dark:text-base-300">
          Total:{" "}
          <b className="font-bold text-green-700 dark:text-green-300">
            {formatCurrency(total)}
          </b>
        </span>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-base-700 dark:text-base-300">
          Acción a aplicar
          {errors.accion && (
            <span className="ms-2 font-normal text-red-600 dark:text-red-400">
              — {errors.accion.message}
            </span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {validActions.map((action) => (
            <Button
              key={action}
              type="button"
              color={accionConfig[action].color}
              outline={accion !== action}
              onClick={() => handleSelectAccion(action)}
            >
              {accionConfig[action].label}
            </Button>
          ))}
        </div>
      </div>

      {config?.fechaLabel && (
        <Input
          label={config.fechaLabel}
          type="date"
          {...register("fecha")}
          error={getFieldError(errors, "fecha")}
          requiredField
        />
      )}
      {accion === "endosar" && (
        <SelectWithSearch
          input={{
            label: "Proveedor",
            placeholder: "Seleccione un proveedor",
            value: proveedorNombre,
          }}
          search={{ placeholder: "Buscar proveedor..." }}
          data={{
            items: proveedores,
            onSelect: (item) => {
              setValue("proveedor_id", item.id, { shouldDirty: true });
              form.clearErrors("proveedor_id");
            },
          }}
          error={getFieldError(errors, "proveedor_id") ?? ""}
          requiredField
        />
      )}
      {needsMotivo && (
        <Input
          label={
            accion === "anular" ? "Motivo de anulación" : "Motivo de rechazo"
          }
          placeholder={
            accion === "anular"
              ? "Ingrese el motivo de la anulación"
              : "Ingrese el motivo del rechazo"
          }
          {...register("motivo")}
          error={getFieldError(errors, "motivo")}
          requiredField
        />
      )}
      {accion === "anularEndoso" && (
        <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
          Los cheques volverán al estado Recibido y se limpiarán los datos del
          endoso.
        </p>
      )}
      {!accion && (
        <p className="rounded-lg border-2 border-dashed border-base-300 px-3 py-4 text-center text-sm text-base-500 dark:border-base-600 dark:text-base-400">
          Seleccioná una acción para continuar.
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowCheques((show) => !show)}
          className="flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {showCheques ? (
            <LuChevronUp className="size-4" />
          ) : (
            <LuChevronDown className="size-4" />
          )}
          {showCheques ? "Ocultar" : "Mostrar"} los {cheques.length} cheques
          seleccionados
        </button>
        {showCheques && (
          <div className="mt-2 max-h-56 divide-y divide-base-200 overflow-y-auto rounded-lg border border-base-200 dark:divide-base-700 dark:border-base-700">
            {cheques.map((cheque) => (
              <div
                key={cheque.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium">
                    N° {cheque.numero ?? "-"}
                  </span>
                  <span className="ms-2 text-base-500 dark:text-base-400">
                    {cheque.cliente?.razon_social ?? "-"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-base-500 dark:text-base-400">
                    F. cobro {formatDateUStoES(cheque.fecha_cobro)}
                  </span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(cheque.importe)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </fieldset>
  );
}
