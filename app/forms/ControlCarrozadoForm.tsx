import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { HiExclamation, HiChevronLeft, HiChevronRight } from "react-icons/hi";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 25, 30];
const ITEMS_PER_PAGE_KEY = "control_carrozado_items_per_page";
const DEFAULT_ITEMS_PER_PAGE = 10;

function getDraftKey(pedidoId: string) {
  return `control_carrozado_draft_${pedidoId}`;
}

function getInitialItemsPerPage(): number {
  try {
    const saved = localStorage.getItem(ITEMS_PER_PAGE_KEY);
    if (saved) {
      const parsed = Number(saved);
      if (ITEMS_PER_PAGE_OPTIONS.includes(parsed)) return parsed;
    }
  } catch {}
  return DEFAULT_ITEMS_PER_PAGE;
}

export function ControlCarrozadoForm({
  register,
  setValue,
  control,
  controlCarrozadoData,
  pedido,
  watch,
  errors,
  clearErrors,
  onPageChange,
}: {
  register: UseFormRegister<ControlCarrozadoForm>;
  setValue: UseFormSetValue<ControlCarrozadoForm>;
  control: Control<ControlCarrozadoForm>;
  controlCarrozadoData: ControlCarrozado[];
  pedido: PedidoFormValues;
  watch: UseFormWatch<ControlCarrozadoForm>;
  errors: FieldErrors<ControlCarrozadoForm>;
  clearErrors: UseFormClearErrors<ControlCarrozadoForm>;
  onPageChange?: (page: number, totalPages: number) => void;
}) {
  const [showObservaciones, setShowObservaciones] = useState<
    Record<number, boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialItemsPerPage);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    clearErrors(`control_carrozado.${index}.resultado`);
  };

  const orderedFields = useMemo(() => {
    return fields
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
  }, [fields, controlCarrozadoData]);

  const totalPages = Math.ceil(orderedFields.length / itemsPerPage);

  const paginatedFields = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return orderedFields.slice(start, start + itemsPerPage);
  }, [orderedFields, currentPage, itemsPerPage]);

  const completedCount = orderedFields.filter(({ originalIndex }) => {
    const val = watch(`control_carrozado.${originalIndex}.resultado`);
    return val !== null && val !== undefined;
  }).length;

  const allWatchedValues = useMemo(() => {
    return orderedFields.map(({ originalIndex }) => ({
      resultado: watch(`control_carrozado.${originalIndex}.resultado`),
      observaciones: watch(`control_carrozado.${originalIndex}.observaciones`),
    }));
  }, [orderedFields, watch]);

  useEffect(() => {
    onPageChange?.(currentPage, totalPages);
  }, [currentPage, totalPages, onPageChange]);

  const handleSetPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    try {
      localStorage.setItem(ITEMS_PER_PAGE_KEY, String(newSize));
    } catch {}
  };

  const saveDraft = useCallback(
    (data: ControlCarrozadoForm["control_carrozado"]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        try {
          if(!pedido.id) return;
          const key = getDraftKey(pedido.id);
          const draft = {
            data,
            savedAt: new Date().toISOString(),
            currentPage,
          };
          localStorage.setItem(key, JSON.stringify(draft));
        } catch {
          // localStorage quota exceeded or not available
        }
      }, 500);
    },
    [pedido.id, currentPage],
  );

  useEffect(() => {
    const subscription = watch((value) => {
      if (value.control_carrozado && Array.isArray(value.control_carrozado)) {
        saveDraft(value.control_carrozado as ControlCarrozadoForm["control_carrozado"]);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <h3 className="my-6 text-lg font-semibold text-gray-700 dark:text-white">
        Ítems de Control
      </h3>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {completedCount} / {orderedFields.length} completados
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Página {currentPage} / {totalPages}
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / pág
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-violet-600 h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${orderedFields.length > 0 ? (completedCount / orderedFields.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Ítems paginados */}
      <div className="flex flex-col gap-4">
        {paginatedFields.map(({ field, itemControl, originalIndex }) => {
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

      {/* Navegación de páginas */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => handleSetPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <HiChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handleSetPage(page)}
                className={`w-8 h-8 text-sm rounded-md transition ${
                  page === currentPage
                    ? "bg-violet-600 text-white font-semibold"
                    : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleSetPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Siguiente
            <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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
