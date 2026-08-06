import { useEffect, useState } from "react";
import type { PedidoFormValues } from "~/types/pedido";
import { Card } from "flowbite-react";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { NavLink } from "react-router";
export default function CardCarroceriaUsadaAsigned({
  pedido,
}: {
  pedido: PedidoFormValues;
}) {
  const { carroceriasUsadas, getCarroceriasUsadasData } =
    useCarroceriasUsadas();
  useEffect(() => {
    if (!carroceriasUsadas) getCarroceriasUsadasData();
  }, [carroceriasUsadas]);
  if (!pedido.carroceria_usada || !carroceriasUsadas) return null;

  const carroceriaUsada = carroceriasUsadas.find(
    (c) => c.id === pedido.carroceria_usada_id,
  );
  if (!carroceriaUsada) return null;
  const [collapse, setCollapse] = useState(true);
  const caracteristicasFields = [
    { label: "Color", value: carroceriaUsada?.color },
    {
      label: "Marca de carrocería",
      value: carroceriaUsada?.marca_carroceria,
    },
    {
      label: "Año de fabricación",
      value: carroceriaUsada?.anno_fabricacion,
    },
    { label: "Material", value: carroceriaUsada?.material },

    { label: "Largo", value: carroceriaUsada?.largo },
    { label: "Ancho", value: carroceriaUsada?.ancho },
    { label: "Alto", value: carroceriaUsada?.alto },
    { label: "Altura de baranda", value: carroceriaUsada?.alt_baranda },
    {
      label: "Puertas por lado",
      value: carroceriaUsada?.ptas_por_lado,
    },
    {
      label: "Arcos por puerta",
      value: carroceriaUsada?.arcos_por_puerta,
    },
    { label: "Tipo de arcos", value: carroceriaUsada?.tipos_arcos },
    {
      label: "Puertas traseras",
      value: carroceriaUsada?.puerta_trasera,
    },
    {
      label: "Líneas de refuerzo",
      value: carroceriaUsada?.lineas_refuerzo,
    },
    { label: "Tipo zócalo", value: carroceriaUsada?.tipo_zocalo },
    { label: "Tipo piso", value: carroceriaUsada?.tipo_piso },
    {
      label: "Corte en guardabarro",
      value:
        typeof carroceriaUsada?.corte_guardabarros === "boolean"
          ? carroceriaUsada?.corte_guardabarros
            ? "Sí"
            : "No"
          : undefined,
    },
    {
      label: "Cumbreras",
      value:
        typeof carroceriaUsada?.cumbreras === "boolean"
          ? carroceriaUsada?.cumbreras
            ? "Sí"
            : "No"
          : undefined,
    },
    {
      label: "Condición",
      value: carroceriaUsada?.condicion,
      customRender: true,
    },
    // Cuchetin
    {
      label: "Cuchetin",
      value:
        typeof carroceriaUsada?.cuchetin === "boolean"
          ? carroceriaUsada?.cuchetin
            ? "Sí"
            : "No"
          : undefined,
      customRender: true,
    },
    {
      label: "Medida cuchetin",
      value: carroceriaUsada?.med_cuchetin,
      customRender: true,
    },
    {
      label: "Altura puerta cuchetin",
      value: carroceriaUsada?.alt_pta_cuchetin,
      customRender: true,
    },
    {
      label: "Altura techo cuchetin",
      value: carroceriaUsada?.alt_techo_cuchetin,
      customRender: true,
    },
    {
      label: "Notas cuchetin",
      value: carroceriaUsada?.notas_cuchetin,
      customRender: true,
    },
    // Accesorios
    {
      label: "Guardabarros",
      value:
        typeof carroceriaUsada?.guardabarros === "boolean"
          ? carroceriaUsada?.guardabarros
            ? "Sí"
            : "No"
          : undefined,
    },
    {
      label: "Depósito agua",
      value:
        typeof carroceriaUsada?.dep_agua === "boolean"
          ? carroceriaUsada?.dep_agua
            ? "Sí"
            : "No"
          : undefined,
    },
    {
      label: "Ubicación depósito agua",
      value: carroceriaUsada?.ubicacion_dep_agua,
    },
    {
      label: "Cintas reflectivas",
      value: carroceriaUsada?.cintas_reflectivas,
    },
    // Boquillas
    { label: "Boquillas", value: carroceriaUsada?.boquillas },
    { label: "Tipo boquillas", value: carroceriaUsada?.tipo_boquillas },

    // Cajón herramientas
    {
      label: "Medida cajón herramientas",
      value: carroceriaUsada?.med_cajon_herramientas,
    },
    {
      label: "Ubicación cajón herramientas",
      value: carroceriaUsada?.ubicacion_cajon_herramientas,
    },
    // Alargues
    {
      label: "Alargue tipo 1",
      value: carroceriaUsada?.alargue_tipo_1,
      customRender: true,
    },
    {
      label: "Cantidad alargue 1",
      value: carroceriaUsada?.cant_alargue_1,
      customRender: true,
    },
    {
      label: "Medida alargue 1",
      value: carroceriaUsada?.med_alargue_1,
      customRender: true,
    },
    {
      label: "Quiebre alargue 1",
      value:
        typeof carroceriaUsada?.quiebre_alargue_1 === "boolean"
          ? carroceriaUsada?.quiebre_alargue_1
            ? "Sí"
            : "No"
          : undefined,
      customRender: true,
    },
    {
      label: "Alargue tipo 2",
      value: carroceriaUsada?.alargue_tipo_2,
      customRender: true,
    },
    {
      label: "Cantidad alargue 2",
      value: carroceriaUsada?.cant_alargue_2,
      customRender: true,
    },
    {
      label: "Medida alargue 2",
      value: carroceriaUsada?.med_alargue_2,
      customRender: true,
    },
    {
      label: "Quiebre alargue 2",
      value:
        typeof carroceriaUsada?.quiebre_alargue_2 === "boolean"
          ? carroceriaUsada?.quiebre_alargue_2
            ? "Sí"
            : "No"
          : undefined,
      customRender: true,
    },
    // Observaciones
    {
      label: "Observaciones",
      value: carroceriaUsada?.notas,
      customRender: true,
    },
    // Datos del camión
    /* Larguero */
    {
      label: "Larguero",
      value: carroceriaUsada?.tipo_larguero,
    },
    {
      label: "Medida de larguero",
      value: carroceriaUsada?.med_larguero,
    },
    {
      label: "Marca camión",
      value: carroceriaUsada?.marca_camion,
      customRender: true,
    },
    {
      label: "Modelo camión",
      value: carroceriaUsada?.modelo_camion,
      customRender: true,
    },
  ];
  const InfoField = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <>
      {value ? (
        <div className="flex flex-col">
          <span className="text-sm text-gray-700 dark:text-gray-400 font-medium mb-1">
            {label}
          </span>
          <span className="text-gray-800 dark:text-gray-200 text-sm">
            {String(value) ?? "-"}
          </span>
        </div>
      ) : null}
    </>
  );

  return (
    <Card className="w-full mx-auto mt-4 shadow-lg border border-violet-200 bg-white dark:bg-gray-800">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-2">
        <div>
          <p className="text-xs text-violet-700 dark:text-violet-300 tracking-widest uppercase font-semibold">
            Tipo de carrozado
          </p>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-white">
            {carroceriaUsada.tipo_carrozado || "-"}
          </h2>
        </div>
        <div>
          <button
            className="text-sm text-violet-700 dark:text-violet-300 underline"
            onClick={() => setCollapse(!collapse)}
          >
            {collapse ? "Mostrar" : "Ocultar"} detalles
          </button>
        </div>
      </div>
      <div className={`flex flex-col gap-4 ${collapse ? "hidden" : "block"}`}>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 ${collapse ? "hidden" : "block"}`}
        >
          {caracteristicasFields
            .filter((field) => !field.customRender)
            .map((field) => (
              <InfoField
                key={field.label}
                label={field.label}
                value={field.value}
              />
            ))}
        </div>
        <p className="col-span-full border-t border-gray-300 pt-2 text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 font-semibold">
          Cuchetín
        </p>
        {carroceriaUsada.cuchetin ? null : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay cuchetín agregado.
          </p>
        )}
        {carroceriaUsada.cuchetin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <InfoField
              label="Medida"
              value={`${carroceriaUsada.med_cuchetin} mm`}
            />
            <InfoField
              label="Altura puerta"
              value={`${carroceriaUsada.alt_pta_cuchetin} mm`}
            />
            <InfoField
              label="Altura techo"
              value={`${carroceriaUsada.alt_techo_cuchetin} mm`}
            />
          </div>
        )}
        <p className="col-span-full border-t border-gray-300 pt-2 text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 font-semibold">
          Alargues
        </p>
        {carroceriaUsada.alargue_tipo_1 ||
        carroceriaUsada.alargue_tipo_2 ? null : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay alargues agregados.
          </p>
        )}
        {(carroceriaUsada.alargue_tipo_1 || carroceriaUsada.alargue_tipo_2) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <InfoField
              label="Baranda a cumbrera"
              value={`${carroceriaUsada.cant_alargue_1} x ${carroceriaUsada.med_alargue_1} mm${carroceriaUsada.quiebre_alargue_1 ? " (con quiebre)" : ""}`}
            />
            <InfoField
              label="Sobre cumbrera"
              value={`${carroceriaUsada.cant_alargue_2} x ${carroceriaUsada.med_alargue_2} mm${carroceriaUsada.quiebre_alargue_2 ? " (con quiebre)" : ""}`}
            />
          </div>
        )}
        {carroceriaUsada.condicion && (
          <div className="col-span-full">
            {/* Condición */}
            <InfoField label="Condición" value={carroceriaUsada.condicion} />
          </div>
        )}
        {carroceriaUsada.notas && (
          <div className="col-span-full">
            {/* Observaciones */}
            <InfoField label="Observaciones" value={carroceriaUsada.notas} />
          </div>
        )}
        <p className="border-t border-gray-300 pt-2 text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 font-semibold">
          Datos del camión donde estaba instalada:
        </p>
        {carroceriaUsada.marca_camion ||
        carroceriaUsada.modelo_camion ? null : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay datos del camión donde estaba instalada esta carrocería.
          </p>
        )}
        {(carroceriaUsada.marca_camion || carroceriaUsada.modelo_camion) && (
          <div className="grid grid-cols-3 gap-2">
            <InfoField
              label="Marca camión"
              value={carroceriaUsada.marca_camion}
            />
            <InfoField
              label="Modelo camión"
              value={carroceriaUsada.modelo_camion}
            />
          </div>
        )}
        <NavLink
          to={`/carrocerias-usadas/${carroceriaUsada.id}`}
          className="mt-4 inline-block text-sm text-violet-700 dark:text-violet-300 underline"
        >
          Ir al registro de esta carrocería usada
        </NavLink>
      </div>
    </Card>
  );
}
