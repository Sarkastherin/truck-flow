import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
} from "flowbite-react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import {
  ToggleSwitch,
  InputNumberIcon,
  Textarea,
  Select,
  Input,
} from "~/components/InputsForm";
import {
  ubicacionOptions,
  cintasOptions,
  tiposBoquillasOptions,
  type AccesoriosUsadosFields,
  arcosOptions,
  tiposArcosOptions,
} from "~/types/pedido";
import { LuRuler } from "react-icons/lu";

export default function AccesoriosUsadosForm<
  T extends FieldValues & AccesoriosUsadosFields,
>({
  register,
  watch,
  setValue,
  withAccordion,
}: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  withAccordion: boolean;
}) {
  const tipoBoquillas = watch("tipo_boquillas" as Path<T>);
  const ubicacionCajon = watch("ubicacion_cajon_herramientas" as Path<T>);
  const depositoAgua = Boolean(watch("dep_agua" as Path<T>));
  const guardabarros = Boolean(watch("guardabarros" as Path<T>));
  const handleChangeArcosField = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedArcos = e.target.value;
    setValue(
      "tipos_arcos" as Path<T>,
      (selectedArcos === "0" ? "N/A" : "") as PathValue<T, Path<T>>,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const content = (
    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-4 items-end">
      <Select
        label="Tipos de boquillas"
        {...register("tipo_boquillas" as Path<T>, {})}
        options={tiposBoquillasOptions}
      />
      <InputNumberIcon
        label="Cantidad de boquillas"
        {...register("boquillas" as Path<T>)}
        icon={LuRuler}
        disabled={tipoBoquillas === "N/A"}
      />
      <Select
        label="Ubic. cajón de herramientas"
        {...register("ubicacion_cajon_herramientas" as Path<T>)}
        options={ubicacionOptions}
      />
      <InputNumberIcon
        label="Medida cajón de herramientas"
        {...register("med_cajon_herramientas" as Path<T>)}
        icon={LuRuler}
        disabled={ubicacionCajon === "N/A" || ubicacionCajon === undefined}
      />
      <Select
        label="Cintas reflectivas"
        {...register("cintas_reflectivas" as Path<T>)}
        options={cintasOptions}
      />
      <Select
        label="Arcos por puerta"
        {...register("arcos_por_puerta" as Path<T>, {
          onChange: handleChangeArcosField,
          valueAsNumber: true,
        })}
        options={arcosOptions}
      />
      <Select
        label="Tipo de arcos"
        {...register("tipos_arcos" as Path<T>)}
        requiredField
        disabled={String(watch("arcos_por_puerta" as Path<T>)) === "0"}
        options={tiposArcosOptions}
      />
      <ToggleSwitch
        id={String("guardabarros" as Path<T>)}
        label="Guardabarros"
        value={guardabarros}
        onCustumChange={(checked) =>
          setValue("guardabarros" as Path<T>, checked as PathValue<T, Path<T>>)
        }
      />
      <ToggleSwitch
        id={String("dep_agua" as Path<T>)}
        label="Depósito de agua"
        value={depositoAgua}
        onCustumChange={(checked) =>
          setValue("dep_agua" as Path<T>, checked as PathValue<T, Path<T>>)
        }
      />
      <Select
        label="Ubic. depósito de agua"
        {...register("ubicacion_dep_agua" as Path<T>)}
        disabled={!depositoAgua}
        options={ubicacionOptions}
      />
    </fieldset>
  );

  if (!withAccordion) {
    return content;
  }

  return (
    <Accordion alwaysOpen>
      <AccordionPanel>
        <AccordionTitle>Accesorios a incluir</AccordionTitle>
        <AccordionContent>{content}</AccordionContent>
      </AccordionPanel>
    </Accordion>
  );
}
