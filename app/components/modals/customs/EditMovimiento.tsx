import {
  useWatch,
  type UseFormReturn,
  type UseFieldArrayReturn,
} from "react-hook-form";
import {
  optionMediosPago,
  type Cheque,
  type Documento,
  type MovimientoFormValues,
} from "~/types/cuentas-corrientes";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import { capitalize } from "~/utils/functions";
import { Input, Select } from "~/components/InputsForm";
import { useMemo, useState } from "react";
import {
  FileInputComponent,
  type FileTypeActions,
} from "~/components/FileInputComponent";
import { useNavigate } from "react-router";
import { useModal } from "~/context/ModalContext";
import { useAdministracion } from "~/context/AdministracionContext";
import { Button, Card } from "flowbite-react";
import { BadgeStatusCheque } from "~/components/specials/Badges";
export default function EditMovimiento({
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
    onAnularPago: (
      movimientoId: string,
      fechaAnulacion: string,
      motivo: string,
      cliente_id: string,
      monto: number,
    ) => Promise<void>;
  };
}) {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const { bancos } = useAdministracion();
  const { form, isEfectivo, files, setFiles, onAnularPago } = props;
  const [showAnulacionModal, setShowAnulacionModal] = useState(false);
  const [fechaAnulacion, setFechaAnulacion] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const isAnulado = form.watch("active") === false;
  const cheques = (form.watch("cheques") as Cheque[]) || [];
  const mediosPagosEfectivo = useMemo(() => {
    return optionMediosPago.filter(
      (option) =>
        option.value === "efectivo" || option.value === "transferencia",
    );
  }, [optionMediosPago]);
  const InfoField = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => {
    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-gray-500 dark:text-violet-300 uppercase tracking-wide">
          {label}
        </span>
        <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
      </div>
    );
  };
  return (
    <>
      <fieldset className="border-t border-gray-300 dark:border-gray-600 pt-5" disabled={form.formState.isSubmitting}>
        <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          📃 Información del movimiento
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-end gap-2">
          <InfoField
            label="Fecha de Movimiento"
            value={formatDateUStoES(form.getValues("fecha_movimiento"))}
          />
          <InfoField
            label="Tipo de Movimiento"
            value={capitalize(form.getValues("tipo_movimiento"))}
          />
          <InfoField
            label="Origen"
            value={capitalize(form.getValues("origen"))}
          />
          <InfoField
            label="Medio de Pago"
            value={capitalize(form.getValues("medio_pago"))}
          />

          <InfoField
            label="Debe"
            value={`$${(form.getValues("debe") || 0).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />
          <InfoField
            label="Haber"
            value={`$${(form.getValues("haber") || 0).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />
        </div>
      </fieldset>
      <fieldset className="border-t border-gray-300 dark:border-gray-600 pt-5" disabled={form.formState.isSubmitting || isAnulado}>
        <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          📝 Campos editables
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-end gap-2 space-y-2">
          {isEfectivo && (
            <Select
              label="Medio de pago"
              {...form.register("medio_pago", { required: true })}
              options={isEfectivo ? mediosPagosEfectivo : optionMediosPago}
              disabled={!isEfectivo}
            />
          )}
          <Input
            label="Referencia"
            {...form.register("referencia")}
            placeholder="Remito, comprobante, etc."
          />
          <div className={`${isEfectivo ? "md:col-span-3" : "md:col-span-4"}`}>
            <Input
              label="Concepto"
              {...form.register("concepto")}
              placeholder="Describa el motivo o concepto del movimiento"
            />
          </div>
          <div className="col-span-full space-y-2">
            <FileInputComponent
              tipoDocumento="movimiento"
              documentos={form.watch("documentos")}
              setFiles={setFiles}
              files={files}
            />
          </div>
        </div>
      </fieldset>
      {form.watch("medio_pago") === "cheque" && (
      <fieldset className="border-t border-gray-300 dark:border-gray-600 pt-5" disabled={form.formState.isSubmitting || isAnulado}>
          <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            💳 Cheques asociados
          </legend>
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            Hay {cheques.length} cheque{cheques.length !== 1 ? "s" : ""} registrado{cheques.length !== 1 ? "s" : ""} en este movimiento.
          </div>
          <div className="space-y-4">
            {cheques.map((cheque) => (
              <Card
                key={cheque.id}
                className="hover:border-violet-400 hover:shadow-md transition-shadow cursor-pointer"
                title="Ir al cheque"
                onClick={() => {
                  openModal("loading", { props: { title: "Cargando cheque..." } });
                  navigate(`/administracion/cheques/${cheque.id}`);
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <InfoField label="Número" value={cheque.numero || "-"} />

                  <InfoField
                    label="Banco"
                    value={
                      bancos?.find((b) => b.value === cheque.banco)?.label ||
                      "-"
                    }
                  />

                  <InfoField
                    label="Importe"
                    value={`$${cheque.importe.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-violet-300 uppercase tracking-wide">
                      {"Estado"}
                    </span>
                    <div className="w-fit">
                      <BadgeStatusCheque
                        status={cheque.status || "en_cartera"}
                      />
                    </div>
                  </div>

                  <InfoField
                    label="Fecha de Cobro"
                    value={new Date(cheque.fecha_cobro).toLocaleDateString(
                      "es-AR",
                    )}
                  />
                  <InfoField label="Tipo" value={capitalize(cheque.tipo)} />
                </div>
                {cheque.notas && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <InfoField label="Notas" value={capitalize(cheque.notas)} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </fieldset>
      )}
      {form.watch("tipo_movimiento") === "pago" &&
        form.watch("medio_pago") !== "cheque" &&
        !isAnulado && (
          <fieldset
            className="border-t border-gray-300 dark:border-gray-600 pt-5"
            disabled={form.formState.isSubmitting}
          >
            <legend className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              ⚠️ Anulación de pago
            </legend>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Esta acción creará un movimiento de deuda para reversar el pago
                de $
                {(form.getValues("haber") || 0).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                .
              </p>
              <Button
                color="red"
                onClick={() => setShowAnulacionModal(true)}
                outline
              >
                Anular este pago
              </Button>
            </div>
          </fieldset>
        )}
      {showAnulacionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Confirmar Anulación de Pago
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se creará un movimiento de deuda por $
              {(form.getValues("haber") || 0).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              para reversar este pago.
            </p>
            <Input
              label="Fecha de anulación"
              type="date"
              value={fechaAnulacion}
              onChange={(e) => setFechaAnulacion(e.target.value)}
              requiredField
            />
            <Input
              label="Motivo de anulación"
              placeholder="Ingrese el motivo de la anulación"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              requiredField
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button
                color="gray"
                onClick={() => {
                  setShowAnulacionModal(false);
                  setMotivoAnulacion("");
                }}
              >
                Cancelar
              </Button>
              <Button
                color="red"
                onClick={async () => {
                  if (!motivoAnulacion.trim()) return;
                  await onAnularPago(
                    form.getValues("id")!,
                    fechaAnulacion,
                    motivoAnulacion,
                    form.getValues("cliente_id"),
                    form.getValues("haber") || 0,
                  );
                  setShowAnulacionModal(false);
                  setMotivoAnulacion("");
                  closeModal();
                }}
                disabled={!motivoAnulacion.trim() || !fechaAnulacion}
              >
                Confirmar Anulación
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
