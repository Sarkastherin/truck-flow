import { useOutletContext } from "react-router";
import type {
  ControlCarrozado,
  ControlCalidadFormValues,
} from "~/types/Configuraciones";
import { Input, Select } from "~/components/InputsForm";
import { LuTrash2 } from "react-icons/lu";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "flowbite-react";
import { useModal } from "~/context/ModalContext";
type FormValues = {
  control_carrozado: ControlCarrozado[];
};
export default function ControlesCalidad() {
  const { openModal } = useModal();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [orderedViewIndexes, setOrderedViewIndexes] = useState<number[] | null>(
    null,
  );
  const { CUDControlCarrozado, itemsControl } = useConfiguracion();
  const { controlCarrozadoData, carrozadoId } = useOutletContext<{
    controlCarrozadoData: ControlCarrozado[] | undefined;
    carrozadoId: string | undefined;
  }>();
  const sortedControlCarrozadoData = [...(controlCarrozadoData || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );
  const { register, handleSubmit, control, watch, getValues, setValue } =
    useForm<FormValues>({
    defaultValues: {
      control_carrozado: sortedControlCarrozadoData,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "control_carrozado",
  });
  const appendDefault: ControlCalidadFormValues = {
    carrozado_id: carrozadoId || "",
    item_control_id: "",
    order:
      Math.max(
        0,
        ...(watch("control_carrozado") || []).map((i) => i.order || 0),
      ) + 1,
  };
  const watchedValores =
    useWatch({
      control,
      name: "control_carrozado",
    }) || [];
  const selectedAtributos = watchedValores
    .map((item) => item?.item_control_id)
    .filter((atributo): atributo is string => Boolean(atributo));
  const canAppendMore = fields.length < itemsControl.length;
  const getAtributoOptions = (index: number) => {
    const currentAtributo = watchedValores[index]?.item_control_id;

    return itemsControl
      .filter(
        (item) =>
          !selectedAtributos.includes(String(item.id)) ||
          item.id === currentAtributo,
      )
      .map((item) => ({
        value: String(item.id),
        label: item.nombre,
      }));
  };
  const handleRemove = (index: number) => {
    const atributo = watch(`control_carrozado.${index}`);
    if (atributo?.id) {
      setDeletedIds((current) =>
        current.includes(atributo.id!) ? current : [...current, atributo.id!],
      );
    }
    remove(index);
    setOrderedViewIndexes(null);
  };
  const handleChangeOrder = (
    index: number,
    value: string,
    previousValue: number,
  ) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) return;
    if (numericValue < 1) return;

    const currentRows = getValues("control_carrozado") || [];
    if (numericValue === previousValue) return;

    const duplicatedIndex = currentRows.findIndex(
      (row, rowIndex) => rowIndex !== index && row.order === numericValue,
    );

    // Si el order nuevo ya existe, intercambiamos valores para mantener unicidad.
    if (duplicatedIndex !== -1) {
      setValue(`control_carrozado.${duplicatedIndex}.order`, previousValue, {
        shouldDirty: true,
      });
    }
  };
  const handleSortByOrder = () => {
    const sortedIndexes = fields
      .map((_, index) => index)
      .sort(
        (a, b) =>
          (watch(`control_carrozado.${a}.order`) || 0) -
          (watch(`control_carrozado.${b}.order`) || 0),
      );

    setOrderedViewIndexes(sortedIndexes);
  };
  const rowIndexes =
    orderedViewIndexes && orderedViewIndexes.length === fields.length
      ? orderedViewIndexes
      : fields.map((_, index) => index);
  const onSubmit = async (data: Pick<FormValues, "control_carrozado">) => {
    openModal("loading", {
      props: {
        title: "Actualizando controles de carrozado...",
      },
    });
    try {
      if (
        (data.control_carrozado && data.control_carrozado.length > 0) ||
        deletedIds.length > 0
      ) {
        const { error } = await CUDControlCarrozado(
          data.control_carrozado || [],
          deletedIds,
        );
        if (error) {
          throw new Error(`Error al guardar controles de carrozado: ${error}`);
        }
        openModal("success", {
          props: {
            title: "Controles de carrozado actualizados",
            message:
              "Los controles de carrozado han sido actualizados exitosamente.",
          },
        });
      } else {
        openModal("info", {
          props: {
            title: "Sin cambios",
            message:
              "No se han realizado cambios en los controles de carrozado.",
          },
        });
      }
    } catch (error) {
      console.error("Error en onSubmit de ControlesCalidadForm:", error);
      openModal("error", {
        props: {
          title: "Error al guardar",
          message:
            error instanceof Error
              ? error.message
              : "Ocurrió un error al actualizar los controles de carrozado. Por favor, intenta nuevamente.",
        },
      });
    }
  };
  return (
    <section className="ps-4 w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="space-y-6">
          {fields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                No hay controles de calidad agregados
              </p>
              <Button
                type="button"
                size="sm"
                color="light"
                className="mx-auto"
                //disabled={!canAppendMore}
                onClick={() => {
                  append(appendDefault as ControlCarrozado);
                  setOrderedViewIndexes(null);
                }}
              >
                Agregar primer control de carrozado
              </Button>
            </div>
          ) : (
            <fieldset className="grid grid-cols-1 gap-4">
              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <Table>
                  <colgroup>
                    <col />
                    <col className="w-[10%]" />
                    <col className="w-[1%]" />
                  </colgroup>
                  <TableHead className="bg-violet-50 dark:bg-violet-400/30">
                    <TableRow className="dark:text-white">
                      <th scope="col" className="px-6 py-3">
                        Ítem de control
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Orden
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <LuTrash2 className="w-4 h-4 mx-auto" />
                      </th>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rowIndexes.map((rowIndex) => {
                      const field = fields[rowIndex];
                      return (
                        <TableRow
                          key={field.id}
                          className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
                        >
                          <TableCell scope="row" className="ps-3 pe-1">
                            <Select
                              sizing="sm"
                              {...register(
                                `control_carrozado.${rowIndex}.item_control_id`,
                              )}
                              options={getAtributoOptions(rowIndex)}
                            />
                          </TableCell>
                          <TableCell className="px-1">
                            <Input
                              type="number"
                              sizing="sm"
                              {...register(`control_carrozado.${rowIndex}.order`, {
                                valueAsNumber: true,
                                onChange: (e) => {
                                  handleChangeOrder(
                                    rowIndex,
                                    e.target.value,
                                    watchedValores[rowIndex]?.order || rowIndex + 1,
                                  );
                                  setOrderedViewIndexes(null);
                                },
                              })}
                              min={0}
                            />
                          </TableCell>
                          <TableCell className="ps-1 pe-3">
                            <Button
                              type="button"
                              color="red"
                              size="sm"
                              onClick={() => handleRemove(rowIndex)}
                              outline
                              className="px-2.5 py-0"
                            >
                              <LuTrash2 className="size-3.5 mx-auto" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Botón agregar otro artículo al final de la lista */}
              <button
                type="button"
                disabled={!canAppendMore}
                onClick={() => {
                  append(appendDefault as ControlCarrozado);
                  setOrderedViewIndexes(null);
                }}
                className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  + Agregar otro control de carrozado
                </span>
              </button>
            </fieldset>
          )}
        </div>
        <div className="space-y-2">
          <Button
            type="button"
            color="light"
            className="ml-auto block"
            onClick={handleSortByOrder}
            disabled={fields.length < 2}
          >
            Ordenar
          </Button>
          <Button
            color={"violet"}
            type="submit"
            className="ml-auto block"
            disabled={false}
          >
            Guardar
          </Button>
        </div>
      </form>
    </section>
  );
}
