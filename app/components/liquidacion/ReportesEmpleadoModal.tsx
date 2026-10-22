import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleSwitch,
} from "flowbite-react";
import { LuTrash2 } from "react-icons/lu";
import { Input, SelectWithSearch } from "~/components/InputsForm";
import { Modal } from "~/components/modals/ModalBase";
import { getFieldError } from "~/utils/formFieldHelpers";
import { usePedido } from "~/context/PedidoContext";
import type { Premios } from "~/types/rrhh";
import type { Employee } from "~/types/rrhh";
import type { ReporteFormValues } from "~/types/liquidaciones";
import { formatCurrency } from "~/utils/formats";

type ReporteRowForm = {
  id?: string;
  premio_id: string;
  cantidad: number;
  asocia_pedido: boolean;
  pedido_id: string;
};

type ReportesFormValues = {
  reportes: ReporteRowForm[];
};

export default function ReportesEmpleadoModal({
  show,
  empleado,
  grupoEmpleados = [],
  rows,
  premios,
  liquidacionId,
  isSaving,
  onSave,
  onClose,
}: {
  show: boolean;
  empleado: Employee | null;
  grupoEmpleados?: Employee[];
  rows: ReporteFormValues[];
  premios: Premios[];
  liquidacionId: string;
  isSaving: boolean;
  onSave: (reportes: ReporteFormValues[], deletedIds: string[]) => void;
  onClose: () => void;
}) {
  const isGrupo = grupoEmpleados.length > 0;
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [pedidoErrorIndex, setPedidoErrorIndex] = useState<number | null>(null);
  const [premioErrorIndex, setPremioErrorIndex] = useState<number | null>(null);
  const [emptyError, setEmptyError] = useState<string | null>(null);
  const { pedidos, getPedidosData } = usePedido();
  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportesFormValues>({ defaultValues: { reportes: [] } });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "reportes",
  });

  useEffect(() => {
    if (show) {
      setDeletedIds([]);
      setPedidoErrorIndex(null);
      setEmptyError(null);
      reset({
        reportes: isGrupo
          ? []
          : rows.map((rep) => ({
              id: rep.id,
              premio_id: rep.premio_id,
              cantidad: Number(rep.cantidad) || 1,
              asocia_pedido: Boolean(rep.pedido_id),
              pedido_id: rep.pedido_id ?? "",
            })),
      });
    }
  }, [show, rows, reset, isGrupo]);

  useEffect(() => {
    if (show && pedidos == null) getPedidosData();
  }, [show, pedidos, getPedidosData]);

  const watchReportes = watch("reportes");

  const premiosOptions = premios
    .filter((premio) => premio.active !== false)
    .map((premio) => ({
      value: String(premio.id),
      label: `${premio.nombre} — ${formatCurrency(Number(premio.precio) || 0)}`,
    }));

  const pedidosItems = (pedidos ?? [])
    .filter((pedido) => pedido.active !== false)
    .map((pedido) => ({
      id: String(pedido.id),
      name: `${pedido.numero_pedido} — ${pedido.cliente?.razon_social ?? "Sin cliente"}`,
    }));
  const premiosItems = (premios ?? [])
    .filter((premio) => premio.active !== false)
    .map((premio) => ({
      id: String(premio.id),
      name: `${premio.nombre} — ${formatCurrency(premio.precio) ?? "-"}`,
    }));
  const getPedidoLabel = (pedidoId: string) => {
    const pedido = (pedidos ?? []).find((p) => String(p.id) === pedidoId);
    if (!pedido) return pedidoId;
    return `${pedido.numero_pedido} — ${pedido.cliente?.razon_social ?? "Sin cliente"}`;
  };
  const getPremioLabel = (premioId: string) => {
    const premio = (premios ?? []).find((p) => String(p.id) === premioId);
    if (!premio) return premioId;
    return `${premio.nombre} — ${formatCurrency(premio.precio) ?? "-"}`;
  };

  const getPrecio = (premioId: string) => {
    const premio = premios.find((p) => String(p.id) === premioId);
    return Number(premio?.precio) || 0;
  };

  const totalEmpleado = (watchReportes ?? []).reduce(
    (acc, row) => acc + getPrecio(row.premio_id) * (Number(row.cantidad) || 0),
    0,
  );

  const handleRemove = (index: number) => {
    const rowId = watchReportes?.[index]?.id;
    if (rowId) {
      setDeletedIds((current) =>
        current.includes(rowId) ? current : [...current, rowId],
      );
    }
    remove(index);
  };

  const handleAppend = () => {
    setEmptyError(null);
    append({
      premio_id: "",
      cantidad: 1,
      asocia_pedido: false,
      pedido_id: "",
    });
  };

  const handleTogglePedido = (index: number, checked: boolean) => {
    if (!checked) {
      setValue(`reportes.${index}.pedido_id`, "");
    }
    setValue(`reportes.${index}.asocia_pedido`, checked);
  };

  const onSubmit = handleSubmit((values) => {
    if (values.reportes.length === 0) {
      setEmptyError("Agregá al menos un premio antes de guardar");
      return;
    }
    const invalidPedidoIndex = values.reportes.findIndex(
      (row) => row.asocia_pedido && !row.pedido_id,
    );
    if (invalidPedidoIndex !== -1) {
      // El select de pedido vive fuera del registro; mostramos el error en la UI
      setPedidoErrorIndex(invalidPedidoIndex);
      return;
    }
    setPedidoErrorIndex(null);
    setEmptyError(null);
    if (isGrupo) {
      const payload: ReporteFormValues[] = grupoEmpleados.flatMap((emp) =>
        values.reportes.map((row) => {
          const item: ReporteFormValues = {
            empleado_id: emp.id,
            liquidacion_id: liquidacionId,
            premio_id: row.premio_id,
            cantidad: Number(row.cantidad) || 0,
          };
          if (row.asocia_pedido && row.pedido_id)
            item.pedido_id = row.pedido_id;
          return item;
        }),
      );
      onSave(payload, []);
      return;
    }
    const payload: ReporteFormValues[] = values.reportes.map((row) => {
      const item: ReporteFormValues = {
        empleado_id: empleado?.id as string,
        liquidacion_id: liquidacionId,
        premio_id: row.premio_id,
        cantidad: Number(row.cantidad) || 0,
      };
      if (row.id) item.id = row.id;
      if (row.asocia_pedido && row.pedido_id) item.pedido_id = row.pedido_id;
      return item;
    });
    onSave(payload, deletedIds);
  });

  return (
    <Modal
      open={show && (isGrupo || Boolean(empleado))}
      title={
        isGrupo
          ? `Reportes — grupo (${grupoEmpleados.length} empleado${grupoEmpleados.length === 1 ? "" : "s"})`
          : empleado
            ? `Reportes — ${empleado.nombre_completo}`
            : "Reportes"
      }
      size="5xl"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <span className="text-sm font-medium text-base-600 dark:text-base-300">
            {isGrupo ? (
              <>
                Total por empleado:{" "}
                <span className="font-bold">
                  {formatCurrency(totalEmpleado)}
                </span>
                <span className="ms-4">
                  Total general:{" "}
                  <span className="font-bold">
                    {formatCurrency(totalEmpleado * grupoEmpleados.length)}
                  </span>
                </span>
              </>
            ) : (
              <>
                Total en premios:{" "}
                <span className="font-bold">
                  {formatCurrency(totalEmpleado)}
                </span>
              </>
            )}
          </span>
          <div className="flex items-center gap-3">
            <Button color="alternative" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button color="yellow" onClick={onSubmit} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar reportes"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {isGrupo && (
          <div className="rounded-lg border border-base-200 bg-base-50 p-3 dark:border-base-700 dark:bg-base-800">
            <p className="mb-2 text-sm font-semibold text-base-700 dark:text-base-200">
              {grupoEmpleados.length} empleado
              {grupoEmpleados.length === 1 ? "" : "s"} seleccionado
              {grupoEmpleados.length === 1 ? "" : "s"}
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto">
              {grupoEmpleados.map((emp) => (
                <li
                  key={emp.id}
                  className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-sm dark:bg-base-900"
                >
                  <span className="text-base-700 dark:text-base-200">
                    {emp.nombre_completo}
                  </span>
                  <span className="text-xs text-base-500 dark:text-base-400">
                    DNI {emp.dni}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {emptyError && (
          <p className="text-sm text-red-600 dark:text-red-400">{emptyError}</p>
        )}
        {fields.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-base-300 py-12 text-center dark:border-base-600">
            <p className="mb-3 text-sm text-base-500 dark:text-base-400">
              {isGrupo
                ? "No hay premios cargados. Agregá el primero para aplicarlo a todos los empleados seleccionados"
                : "No hay reportes cargados para este empleado"}
            </p>
            <Button
              type="button"
              size="sm"
              color="light"
              className="mx-auto"
              onClick={handleAppend}
            >
              Agregar el primer reporte
            </Button>
          </div>
        ) : (
          <fieldset className="grid grid-cols-1 gap-4">
            <div className="relative overflow-x-auto rounded-lg shadow-md" style={{ minHeight: "calc(100vh - 400px" }}>
              <Table>
                <colgroup>
                  <col className="" />
                  <col className="w-[1%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[1%]" />
                </colgroup>
                <TableHead className="bg-yellow-50 dark:bg-yellow-400/30">
                  <TableRow className="dark:text-white">
                    <th scope="col" className="px-4 py-3">
                      Premio
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Cant.
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Pedido (opcional)
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Subtotal
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <LuTrash2 className="mx-auto h-4 w-4" />
                    </th>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field, index) => {
                    const row = watchReportes?.[index];
                    const subtotal =
                      getPrecio(row?.premio_id ?? "") *
                      (Number(row?.cantidad) || 0);
                    return (
                      <TableRow
                        key={field.id}
                        className="border-b border-base-200 bg-white dark:border-base-700 dark:bg-base-800"
                      >
                        <TableCell scope="row" className="py-3 ps-4 pe-2">
                          <SelectWithSearch
                            input={{
                              label: "",
                              placeholder: "Buscar premio",
                              value: row.premio_id
                                ? getPremioLabel(row.premio_id)
                                : "",
                            }}
                            search={{
                              placeholder: "Buscar premio",
                            }}
                            data={{
                              items: premiosItems,
                              onSelect: (premio) => {
                                setValue(
                                  `reportes.${index}.premio_id`,
                                  premio.id,
                                );
                                setPremioErrorIndex(null);
                              },
                            }}
                            error={
                              premioErrorIndex === index
                                ? "Seleccioná un premio o desactivá la opción"
                                : ""
                            }
                          />
                          
                        </TableCell>
                        <TableCell className="px-2 py-3">
                          <Input
                            type="number"
                            min={1}
                            {...register(`reportes.${index}.cantidad`, {
                              required: "Requerido",
                              valueAsNumber: true,
                              min: { value: 1, message: "Mínimo 1" },
                            })}
                            error={getFieldError(
                              errors,
                              `reportes.${index}.cantidad`,
                            )}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-3">
                          <div className="space-y-2">
                            <ToggleSwitch
                              checked={Boolean(row?.asocia_pedido)}
                              onChange={(checked) =>
                                handleTogglePedido(index, checked)
                              }
                              label="Asociar a pedido"
                            />
                            {row?.asocia_pedido && (
                              <>
                                <SelectWithSearch
                                  input={{
                                    label: "Pedido",
                                    placeholder: "Buscar por cliente o número",
                                    value: row.pedido_id
                                      ? getPedidoLabel(row.pedido_id)
                                      : "",
                                  }}
                                  search={{
                                    placeholder: "Buscar pedido",
                                  }}
                                  data={{
                                    items: pedidosItems,
                                    onSelect: (pedido) => {
                                      setValue(
                                        `reportes.${index}.pedido_id`,
                                        pedido.id,
                                      );
                                      setPedidoErrorIndex(null);
                                    },
                                  }}
                                  error={
                                    pedidoErrorIndex === index
                                      ? "Seleccioná un pedido o desactivá la opción"
                                      : ""
                                  }
                                />
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-end text-sm font-semibold whitespace-nowrap">
                          {formatCurrency(subtotal)}
                        </TableCell>
                        <TableCell className="ps-2 pe-4">
                          <Button
                            type="button"
                            color="red"
                            size="sm"
                            outline
                            className="px-2.5 py-0"
                            onClick={() => handleRemove(index)}
                            disabled={isSaving}
                          >
                            <LuTrash2 className="mx-auto size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <button
              type="button"
              onClick={handleAppend}
              disabled={isSaving}
              className="w-full rounded-lg border-2 border-dashed border-base-300 bg-base-50/50 p-4 transition-all hover:border-yellow-400 hover:bg-yellow-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-base-600 dark:bg-base-800/50 dark:hover:border-yellow-600 dark:hover:bg-yellow-900/20"
            >
              <span className="text-sm font-medium text-base-600 transition-colors hover:text-yellow-600 dark:text-base-400 dark:hover:text-yellow-400">
                + Agregar otro reporte
              </span>
            </button>
          </fieldset>
        )}
      </div>
    </Modal>
  );
}
