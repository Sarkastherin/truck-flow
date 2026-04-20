import { type UseFormReturn, useWatch } from "react-hook-form";
import type { SocioComercialFormValues } from "~/types/socios";
import {
  CuitInput,
  Input,
  PhoneInput,
  Select,
  SelectWithSearch,
  Textarea,
} from "~/components/InputsForm";
import { useSociosComercial } from "~/context/SociosComercialesContext";
import { useMemo } from "react";
import { useConfiguracion } from "~/context/ConfiguracionesContext";

export function SocioModal({
  props,
}: {
  props: {
    title: string;
    form: UseFormReturn<SocioComercialFormValues>;
    onDelete?: () => void;
    onReactivate?: () => void;
    tipoSocio?: "cliente" | "proveedor";
  };
}) {
  const { vendedoresOptions } = useConfiguracion();
  const { provincias, localidades } = useSociosComercial();
  const { form } = props;
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;
  // Registrar el campo CUIT para validaciones de react-hook-form
  const cuitRegister = register("cuit_cuil", {
    required: "El CUIT/CUIL es obligatorio",
  });

  const provinciasOptions = provincias
    ? provincias.map((provincia) => ({
        name: provincia.nombre,
        id: provincia.id,
      }))
    : [];
  const telefonoContacto = useWatch({
    control,
    name: "telefono_contacto",
  });
  const cuitCuil = useWatch({
    control,
    name: "cuit_cuil",
  });
  const provinciaValue = useWatch({
    control,
    name: "provincia",
  });
  const localidadValue = useWatch({
    control,
    name: "localidad",
  });
  const localidadesByProvincia = useMemo(() => {
    if (!localidades || !provinciaValue) return [];
    return localidades.filter((loc) => loc.provincia.nombre === provinciaValue);
  }, [localidades, provinciaValue]);
  return (
    <fieldset
      className="grid grid-cols-1 md:grid-cols-6 gap-2"
      disabled={form.formState.isSubmitting}
    >
      <div className="md:col-span-6">
        <Input
          label="Razón Social"
          placeholder=" NOMBRE DE LA COMPAÑIA S.A."
          {...register("razon_social", {
            required: "La razón social es obligatoria",
          })}
          error={errors.razon_social?.message}
          requiredField={true}
        />
      </div>
      <div className="md:col-span-6">
        <Input
          label="Nombre de Contacto"
          placeholder="Juan Encargado Pérez"
          {...register("nombre_contacto")}
          error={errors.nombre_contacto?.message}
        />
      </div>
      <div className="md:col-span-2">
        <PhoneInput
          label="Teléfono"
          value={telefonoContacto || ""}
          onChange={(value) =>
            setValue("telefono_contacto", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={errors.telefono_contacto?.message}
        />
      </div>
      <div className="md:col-span-2">
        <Input
          label="Email"
          type="email"
          placeholder="ejemplo@dominio.com"
          {...register("email_contacto", {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "El email no es válido",
            },
          })}
          error={errors.email_contacto?.message}
        />
      </div>
      <div className="md:col-span-2">
        <CuitInput
          label="CUIT/CUIL"
          value={cuitCuil || ""}
          onChange={(value) => {
            setValue("cuit_cuil", value, {
              shouldDirty: true,
              shouldValidate: true,
            });
            // Disparar también el onChange de react-hook-form
            cuitRegister.onChange({
              target: { name: "cuit_cuil", value },
            } as any);
          }}
          error={errors.cuit_cuil?.message}
          requiredField={true}
        />
      </div>
      <div className="md:col-span-3">
        <SelectWithSearch
          input={{
            label: "Provincia",
            placeholder: "Selecciona una provincia",
            value: provinciaValue || "",
          }}
          search={{
            placeholder: "Buscar provincia",
          }}
          data={{
            items: provinciasOptions,
            onSelect: (provincia) => {
              setValue("provincia", provincia.name, {
                shouldDirty: true,
              });
              setValue("provincia_id", provincia.id, {
                shouldDirty: true,
              });
              // filtrar localidades por provincia seleccionada
              setValue("localidad", "", {
                shouldDirty: true,
              });
            },
          }}
          error={
            typeof errors.provincia_id?.message === "string"
              ? errors.provincia_id?.message
              : ""
          }
          requiredField
        />
      </div>
      <div className="md:col-span-3">
        <SelectWithSearch
          input={{
            label: "Localidad",
            placeholder: "Selecciona una localidad",
            value: localidadValue || "",
          }}
          search={{
            placeholder: "Buscar localidad",
          }}
          data={{
            items: localidadesByProvincia
              ? localidadesByProvincia.map((loc) => ({
                  name: loc.nombre,
                  id: loc.id,
                }))
              : [],
            onSelect: (localidad) => {
              setValue("localidad", localidad.name, {
                shouldDirty: true,
              });
              setValue("localidad_id", localidad.id, {
                shouldDirty: true,
              });
            },
          }}
          error={
            typeof errors.localidad_id?.message === "string"
              ? errors.localidad_id?.message
              : ""
          }
          requiredField
          disabled={!provinciaValue} // Deshabilitar si no se ha seleccionado una provincia
        />
      </div>
      <div className="md:col-span-6">
        <Input
          label="Dirección"
          placeholder="Calle Ejemplo 123"
          {...register("direccion")}
          error={errors.direccion?.message}
          disabled={!localidadValue} // Deshabilitar si no se ha seleccionado una localidad
        />
      </div>
      {props.tipoSocio === "cliente" && (
        <>
          <div className="md:col-span-3">
            <Select
              label="Condición de IVA"
              {...register("condicion_iva", {
                required: "La condición de IVA es obligatoria",
              })}
              error={errors.condicion_iva?.message}
              requiredField
              options={[
                {
                  value: "Responsable Inscripto",
                  label: "Responsable Inscripto",
                },
                { value: "Monotributista", label: "Monotributista" },
                { value: "Exento", label: "Exento" },
                { value: "Consumidor Final", label: "Consumidor Final" },
              ]}
            />
          </div>
          <div className="md:col-span-3">
            <Select
              label="Vendedor Asignado"
              {...register("vendedor_id", {
                required: "Este campo es requerido",
              })}
              error={errors.vendedor_id?.message}
              requiredField={true}
              options={vendedoresOptions}
              disabledEmptyOption={true}
              emptyOption="Seleccione el vendedor"
            />
          </div>
        </>
      )}
      <div className="md:col-span-6">
        <Textarea
          label="Observaciones"
          placeholder="Información adicional sobre el cliente"
          {...register("notas")}
          error={errors.notas?.message}
        />
      </div>
    </fieldset>
  );
}
