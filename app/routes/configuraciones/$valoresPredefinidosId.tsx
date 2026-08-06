import { useOutletContext } from "react-router";
import type { ValoresPredefinidosFormValues, ValorPredefinido } from "~/types/Configuraciones";
import { atributosConMetadata } from "~/types/pedido";
import { Input, Select } from "~/components/InputsForm";
import { LuTrash2 } from "react-icons/lu";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import { useMemo } from "react";
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
  valores_predefinidos: ValorPredefinido[];
};
export default function ValoresPredefinidos() {
  const { openModal } = useModal();
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const { puertasOptions, CUDValoresPredefinidos } = useConfiguracion();
  const { valoresPredefinidoData, carrozadoId } = useOutletContext<{
    valoresPredefinidoData: ValorPredefinido[] | undefined;
    carrozadoId: string | undefined;
  }>();
  const dinamicAtributos = useMemo(() => {
    return atributosConMetadata
      .filter((atributo) => atributo.disabledDefaultValues !== true)
      .map((atributo) => {
        if (atributo.value === "puerta_trasera_id") {
          return {
            ...atributo,
            options: puertasOptions,
          };
        }
        return { ...atributo };
      });
  }, [puertasOptions]);
  const { register, handleSubmit, control, watch } = useForm<FormValues>({
    defaultValues: {
      valores_predefinidos: valoresPredefinidoData || [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "valores_predefinidos",
  });
  const watchedValores =
    useWatch({
      control,
      name: "valores_predefinidos",
    }) || [];

  const selectedAtributos = watchedValores
    .map((item) => item?.atributo)
    .filter((atributo): atributo is string => Boolean(atributo));

  const getAtributoOptions = (index: number) => {
    const currentAtributo = watchedValores[index]?.atributo;

    return dinamicAtributos
      .filter(
        (atributo) =>
          !selectedAtributos.includes(String(atributo.value)) ||
          atributo.value === currentAtributo,
      )
      .map((atributo) => ({
        value: String(atributo.value),
        label: atributo.label,
      }));
  };

  const canAppendMore = fields.length < dinamicAtributos.length;
  const appendDefault: ValoresPredefinidosFormValues = {
    carrozado_id: carrozadoId || "",
    atributo: "",
    valor: "",
    tipo: "seleccionable",
  };
  const handleRemove = (index: number) => {
    const atributo = watch(`valores_predefinidos.${index}`);
    if (atributo?.id) {
      setDeletedIds((current) =>
        current.includes(atributo.id!) ? current : [...current, atributo.id!],
      );
    }
    remove(index);
  };
  const onSubmit = async (data: Pick<FormValues, "valores_predefinidos">) => {
      openModal("loading", {
        props: {
          title: "Actualizando valores predefinidos...",
        },
      });
      try {
        if (data.valores_predefinidos && data.valores_predefinidos.length > 0 || deletedIds.length > 0) {
          const { error } = await CUDValoresPredefinidos(
            data.valores_predefinidos || [],
            deletedIds,
          );
          if (error) {
            throw new Error(`Error al guardar valores predefinidos: ${error}`);
          }
          openModal("success", {
            props: {
              title: "Valores predefinidos actualizados",
              message:
                "Los valores predefinidos han sido actualizados exitosamente.",
            },
          });
        }
        else {
          openModal("info", {
            props: {
              title: "Sin cambios",
              message: "No se han realizado cambios en los valores predefinidos.",
            },
          });
        }
      } catch (error) {
        console.error("Error en onSubmit de ValoresPredefinidosForm:", error);
        openModal("error", {
          props: {
            title: "Error al guardar",
            message:
              error instanceof Error
                ? error.message
                : "Ocurrió un error al actualizar los valores predefinidos. Por favor, intenta nuevamente.",
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
                No hay valores predefinidos agregados
              </p>
              <Button
                type="button"
                size="sm"
                color="light"
                className="mx-auto"
                disabled={!canAppendMore}
                onClick={() => append(appendDefault as ValorPredefinido)}
              >
                Agregar primer valor predefinido
              </Button>
            </div>
          ) : (
            <fieldset className="grid grid-cols-1 gap-4">
              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <Table>
                  <colgroup>
                    <col className="w-[30%]" />
                    <col />
                    <col className="w-[20%]" />
                    <col className="w-[1%]" />
                  </colgroup>
                  <TableHead className="bg-violet-50 dark:bg-violet-400/30">
                    <TableRow className="dark:text-white">
                      <th scope="col" className="px-6 py-3">
                        Atributo
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Valor
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3">
                        <LuTrash2 className="w-4 h-4 mx-auto" />
                      </th>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => {
                      const currentAtributo = watchedValores[index]?.atributo;
                      const currentAtributoMetadata = dinamicAtributos.find(
                        (atributo) => atributo.value === currentAtributo,
                      );

                      return (
                        <TableRow
                          key={field.id}
                          className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
                        >
                          <TableCell scope="row" className="ps-3 pe-1">
                            <Select
                              sizing="sm"
                              {...register(
                                `valores_predefinidos.${index}.atributo`,
                              )}
                              options={getAtributoOptions(index)}
                            />
                          </TableCell>
                          <TableCell className="px-1">
                            {currentAtributoMetadata?.fieldType === "select" ? (
                              <Select
                                sizing="sm"
                                {...register(
                                  `valores_predefinidos.${index}.valor`,
                                )}
                                options={
                                  currentAtributoMetadata.options?.map(
                                    (opt) => ({
                                      ...opt,
                                      value: String(opt.value),
                                    }),
                                  ) || []
                                }
                              />
                            ) : (
                              <Input
                                sizing="sm"
                                {...register(
                                  `valores_predefinidos.${index}.valor`,
                                )}
                              />
                            )}
                          </TableCell>
                          <TableCell className="px-1">
                            <Select
                              sizing="sm"
                              {...register(
                                `valores_predefinidos.${index}.tipo`,
                              )}
                              options={[
                                {
                                  value: "seleccionable",
                                  label: "Opcional",
                                },
                                { value: "fijo", label: "Fijo" },
                              ]}
                            />
                          </TableCell>
                          <TableCell className="ps-1 pe-3">
                            <Button
                              type="button"
                              color="red"
                              size="sm"
                              onClick={() => handleRemove(index)}
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
                onClick={() => append(appendDefault as ValorPredefinido)}
                className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                  + Agregar otro valor predefinido
                </span>
              </button>
            </fieldset>
          )}
        </div>
        <div className="space-y-2">
          <Button color={'violet'} type="submit" className="ml-auto block" disabled={false}>
            Guardar
          </Button>
        </div>
      </form>
    </section>
  );
}
