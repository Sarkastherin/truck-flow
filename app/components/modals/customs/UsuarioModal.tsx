import type { UseFormReturn } from "react-hook-form";
import { optionsRoles, type UsersTable } from "~/types/users";
import { Input, Select } from "~/components/InputsForm";
import { useState } from "react";
import { Button } from "flowbite-react";
import InfoFieldsComponent from "~/components/InfoFieldsComponent";
export function UsuarioModal({
  props,
}: {
  props: {
    title: string;
    form: UseFormReturn<UsersTable>;
    onDelete?: () => void;
    onReactivate?: () => void;
  };
}) {
  const { form } = props;
  const [showMore, setShowMore] = useState(false);

  return (
    <fieldset
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      disabled={form.formState.isSubmitting}
    >
      <Input
        label="Nombre"
        {...form.register("nombre", { required: "El nombre es obligatorio" })}
        error={form.formState.errors.nombre?.message}
      />
      <Input
        label="Apellido"
        {...form.register("apellido", {
          required: "El apellido es obligatorio",
        })}
        error={form.formState.errors.apellido?.message}
      />
      <Input
        label="Email (Debe ser una cuenta de Google)"
        {...form.register("email", {
          required: "El email es obligatorio",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "El email no es válido",
          },
        })}
        error={form.formState.errors.email?.message}
      />
      <Select
        label="Rol"
        {...form.register("role", { required: "El rol es obligatorio" })}
        error={form.formState.errors.role?.message}
        options={optionsRoles}
      />
      <div className="md:col-span-2">
        {props.onDelete && (
          <Button
            type="button"
            onClick={props.onDelete}
            color="red"
            className="w-full"
            outline={true}
          >
            Desactivar Usuario
          </Button>
        )}
        {props.onReactivate && (
          <Button
            type="button"
            onClick={props.onReactivate}
            color="green"
            className="w-full"
            outline={true}
          >
            Reactivar Usuario
          </Button>
        )}
      </div>
      <InfoFieldsComponent
        created_at={form.getValues("created_at")}
        created_by={form.getValues("created_by")}
        updated_at={form.getValues("updated_at")}
        updated_by={form.getValues("updated_by")}
      />
    </fieldset>
  );
}
