import { useFieldArray } from "react-hook-form";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "flowbite-react";
import { LuTrash2 } from "react-icons/lu";
import { Select, Input } from "~/components/InputsForm";
import { getFieldError } from "~/utils/formFieldHelpers";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import type { TrabajoChasis } from "~/types/pedido";
import type {
  Control,
  FieldArray,
  FieldArrayPath,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";

type TrabajoChasisRowFieldName = "tipo_trabajo_id" | "descripcion";

type TrabajoChasisItem = Partial<TrabajoChasis> & {
  tipo_trabajo_id: string;
  descripcion: string;
};

export function TrabajosChasisForm<
  TFieldValues extends FieldValues = FieldValues,
>({
  register,
  control,
  watch,
  errors,
  pedidoId,
  fieldArrayPath = "trabajo_chasis",
  setDeletedIds,
}: {
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  pedidoId?: string;
  fieldArrayPath?: string;
  setDeletedIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { trabajosChasisOptions } = useConfiguracion()!;
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldArrayPath as FieldArrayPath<TFieldValues>,
  });

  const buildRowFieldName = (
    index: number,
    fieldName: TrabajoChasisRowFieldName,
  ) => {
    return `${fieldArrayPath}.${index}.${fieldName}` as Path<TFieldValues>;
  };

  const getRowFieldError = (
    index: number,
    fieldName: TrabajoChasisRowFieldName,
  ) => {
    return getFieldError(errors, buildRowFieldName(index, fieldName));
  };

  const buildNewItem = () => {
    return {
      pedido_id: pedidoId,
      tipo_trabajo_id: "",
      descripcion: "",
    } as FieldArray<TFieldValues, FieldArrayPath<TFieldValues>>;
  };

  const handleRemove = (index: number) => {
    const currentItems =
      (watch(fieldArrayPath as Path<TFieldValues>) as
        | TrabajoChasisItem[]
        | undefined) || [];
    const item = currentItems[index];

    if (item?.id) {
      setDeletedIds((current) =>
        current.includes(item.id!) ? current : [...current, item.id!],
      );
    }

    remove(index);
  };
  return (
    <div className="space-y-6">
      {fields.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            No hay trabajos en chasis agregados
          </p>
          <Button
            type="button"
            size="sm"
            color="light"
            className="mx-auto"
            onClick={() => append(buildNewItem())}
          >
            Agregar primer trabajo en chasis
          </Button>
        </div>
      ) : (
        <fieldset className="grid grid-cols-1 gap-4">
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <Table>
              <colgroup>
                <col className="w-[30%]" />
                <col />
                <col className="w-[1%]" />
              </colgroup>
              <TableHead className="bg-violet-50 dark:bg-violet-400/30">
                <TableRow className="dark:text-white">
                  <th scope="col" className="px-6 py-3">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Observación
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <LuTrash2 className="w-4 h-4 mx-auto" />
                  </th>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow
                    key={field.id}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
                  >
                    <TableCell scope="row" className="py-4 ps-6 pe-2">
                      <Select
                        sizing={"sm"}
                        {...register(
                          buildRowFieldName(index, "tipo_trabajo_id"),
                          {
                            required: "Este campo es obligatorio",
                          },
                        )}
                        error={getRowFieldError(index, "tipo_trabajo_id")}
                        options={trabajosChasisOptions.filter((opt) => {
                          const currentItems = watch(
                            fieldArrayPath as Path<TFieldValues>,
                          ) as TrabajoChasisItem[] | undefined;
                          const selectedInOtherRows = (currentItems ?? [])
                            .filter((_, i) => i !== index)
                            .map((item) => item.tipo_trabajo_id);
                          const currentValue =
                            currentItems?.[index]?.tipo_trabajo_id;
                          return (
                            !selectedInOtherRows.includes(opt.value) ||
                            opt.value === currentValue
                          );
                        })}
                      />
                    </TableCell>
                    <TableCell className="px-2">
                      <Input
                        sizing={"sm"}
                        placeholder="Descripción"
                        {...register(buildRowFieldName(index, "descripcion"))}
                        error={getRowFieldError(index, "descripcion")}
                      />
                    </TableCell>
                    <TableCell className="ps-2 pe-6">
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
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Botón agregar otro artículo al final de la lista */}
          <button
            type="button"
            onClick={() => append(buildNewItem())}
            className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              + Agregar otro trabajo en chasis
            </span>
          </button>
        </fieldset>
      )}
    </div>
  );
}
