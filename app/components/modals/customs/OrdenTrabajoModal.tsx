import { Badge, Button, Card, ButtonGroup } from "flowbite-react";
import { use, useEffect, useMemo, useState } from "react";
import { Input, Select, Textarea } from "~/components/InputsForm";
import { useConfiguracion } from "~/context/ConfiguracionesContext";
import type {
  OrdenesTrabajo,
  OrdenesTrabajoFormValues,
  Pedido,
} from "~/types/pedido";
import { createElement } from "react";
import { OrdenFabricacionTemplate } from "~/components/pdf/OrdenFabricacionTemplate";
import { OrdenPinturaTemplate } from "~/components/pdf/OrdenPinturaTemplate";
import { pdf } from "@react-pdf/renderer";
import { LoadingComponent } from "~/components/LoadingComponent";
import { usePedido } from "~/context/PedidoContext";
import type { TipoOrden } from "~/types/pedido";
import { formatDateUStoES } from "~/backend/Database/helperTransformData";
import {
  LuUser,
  LuTruck,
  LuCircleCheck,
  LuTriangleAlert,
  LuArchiveX,
} from "react-icons/lu";
import { FaFilePdf } from "react-icons/fa6";
import { TfiReload } from "react-icons/tfi";
import { Link } from "react-router";
import type { IconType } from "react-icons";
import { capitalize } from "~/utils/functions";
import { OrdenMontajeTemplate } from "~/components/pdf/OrdenMontajeTemplate";
import { ControlCarrozadoTemplate } from "~/components/pdf/ControlCarrozadoTemplate";
import type { ControlCarrozado } from "~/types/Configuraciones";
import { BadgeStatusOT } from "~/components/specials/Badges";
import { mergePDFs } from "~/utils/pdfMerge";
type ModalStep = {
  type:
    | "form"
    | "existing"
    | "preview"
    | "saving"
    | "success"
    | "existing"
    | "error"
    | "confirmRegenerate"
    | "regenerating";
  message?: string;
};

export default function OrdenTrabajoModal({
  pedido,
  tipo,
  order,
  controlCarrozado,
}: {
  pedido: Pedido;
  tipo: TipoOrden;
  order: OrdenesTrabajo | undefined;
  controlCarrozado: ControlCarrozado[];
}) {
  const { createNewOrdenTrabajo, deleteOrdenTrabajo, closeOrdenTrabajo } =
    usePedido();
  const [step, setStep] = useState<ModalStep>({
    type: order ? "existing" : "form",
    message: "",
  });
  const {
    armadoresOptions,
    pintoresOptions,
    montadoresOptions,
    carrozados,
    puertasTraseras,
    colores,
    trabajosChasis,
  } = useConfiguracion();

  const [responsable, setResponsable] = useState({ id: "", nombre: "" });
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<OrdenesTrabajoFormValues>>(
    {},
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const carrozadoNombre = useMemo(() => {
    return (
      carrozados.find((c) => c.id === pedido.carroceria?.tipo_carrozado_id)
        ?.nombre ?? "—"
    );
  }, [carrozados, pedido.carroceria?.tipo_carrozado_id]);
  const puertaTraseraNombre = useMemo(() => {
    return (
      puertasTraseras.find((p) => p.id === pedido.carroceria?.puerta_trasera_id)
        ?.nombre ?? "—"
    );
  }, [puertasTraseras, pedido.carroceria?.puerta_trasera_id]);
  const colorCarrozadoNombre = useMemo(() => {
    return (
      colores.find((c) => c.id === pedido.carroceria?.color_carrozado_id)
        ?.nombre ?? "—"
    );
  }, [colores, pedido.carroceria?.color_carrozado_id]);
  const colorZocaloNombre = useMemo(() => {
    return (
      colores.find((c) => c.id === pedido.carroceria?.color_zocalo_id)
        ?.nombre ?? "—"
    );
  }, [colores, pedido.carroceria?.color_zocalo_id]);
  const colorLonaNombre = useMemo(() => {
    return (
      colores.find((c) => c.id === pedido.carroceria?.color_lona_id)?.nombre ??
      "—"
    );
  }, [colores, pedido.carroceria?.color_lona_id]);
  const getConfigOrder: Record<
    TipoOrden,
    {
      responsableOptions: typeof armadoresOptions;
      templatePDF: { template: React.FC<any>; props: any };
      cargo: string;
      nextStatus: string;
      closeStatus?: string;
    }
  > = {
    fabricacion: {
      responsableOptions: armadoresOptions,
      templatePDF: {
        template: OrdenFabricacionTemplate,
        props: {
          pedidoData: pedido,
          responsable: responsable.nombre,
          carrozadoNombre,
          puertaTraseraNombre,
          colorCarrozadoNombre,
          colorZocaloNombre,
          colorLonaNombre,
        },
      },
      cargo: "armador",
      nextStatus: "en_produccion",
    },
    pintura: {
      responsableOptions: pintoresOptions,
      templatePDF: {
        template: OrdenPinturaTemplate,
        props: {
          pedidoData: pedido,
          responsable: responsable.nombre,
          colorCarrozadoNombre,
          colorZocaloNombre,
          colorLonaNombre,
        },
      },
      cargo: "pintor",
      nextStatus: "en_pintura",
      closeStatus: "pintada",
    },
    montaje: {
      responsableOptions: montadoresOptions,
      templatePDF: {
        template: OrdenMontajeTemplate,
        props: {
          pedidoData: pedido,
          responsable: responsable.nombre,
          carrozadoNombre,
          puertaTraseraNombre,
          colorCarrozadoNombre,
          colorZocaloNombre,
          colorLonaNombre,
          trabajosChasis,
        },
      },
      cargo: "montajista",
      nextStatus: "en_montaje",
      closeStatus: "finalizada",
    },
    control_carrozado: {
      responsableOptions: armadoresOptions,
      templatePDF: {
        template: ControlCarrozadoTemplate,
        props: {
          pedidoData: pedido,
          responsable: responsable.nombre,
          controlCarrozado,
          carrozadoNombre,
          puertaTraseraNombre,
          colorCarrozadoNombre,
          colorZocaloNombre,
        },
      },
      cargo: "control_calidad_carrozado",
      nextStatus: "en_control",
      closeStatus: "controlada",
    },
  };

  // Limpiar URL del blob cuando cambie el PDF
  useEffect(() => {
    if (pdfBlob) {
      // Limpiar URL anterior si existe
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      // Crear nueva URL
      const newUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(newUrl);

      // Cleanup function
      return () => {
        URL.revokeObjectURL(newUrl);
      };
    } else {
      // Si no hay blob, limpiar URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }
  }, [pdfBlob]);
  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);
  const titles = useMemo(() => {
    const sing =
      tipo !== "control_carrozado" ? "Órden de Trabajo" : "Control de Calidad";
    return { sing };
  }, []);
  const handleGenerarOrden = async () => {
    setStep({
      type: "saving",
      message: `Generando ${titles.sing.toLowerCase()}...`,
    });
    try {
      // Generar orden en PDF
      const pdfContent: React.ReactElement<any> = createElement(
        getConfigOrder[tipo].templatePDF.template,
        getConfigOrder[tipo].templatePDF.props,
      );

      const pdfInstance = pdf(pdfContent);
      const blob = await pdfInstance.toBlob();
      if (blob.size === 0) {
        throw new Error(
          "El PDF generado está vacío. Puede ser un problema con los datos o el template.",
        );
      }

      // Merge con documentos asociados (solo para órdenes de fabricación)
      const documentosPedido = pedido.documentos || [];
      let finalBlob = blob;
      if (tipo === "fabricacion" && documentosPedido.length > 0) {
        setStep({
          type: "saving",
          message: `Adjuntando ${documentosPedido.length} documento(s)...`,
        });
        finalBlob = await mergePDFs(blob, documentosPedido);
      }

      setPdfBlob(finalBlob);
      // Mostrar previa del PDF o descargarlo directamente
      setStep({
        type: "preview",
        message: `${titles.sing} generada correctamente.`,
      });
    } catch (error) {
      console.error(
        `Error al generar el PDF de ${titles.sing.toLowerCase()}:`,
        error,
      );
      setStep({
        type: "error",
        message: `Error al generar ${titles.sing.toLowerCase()}.`,
      });
    }
  };
  const handleRegenerarOrden = async () => {
    let message = null;
    setStep({
      type: "saving",
      message: `Regenerando ${titles.sing.toLowerCase()}...`,
    });
    try {
      if (order?.id && order.url_archivo) {
        const { error } = await deleteOrdenTrabajo(order.id, order.url_archivo);
        if (error) {
          if (error?.includes("Error al eliminar el archivo de Drive")) {
            message = `Error al eliminar el archivo de Drive. La/El ${titles.sing.toLowerCase()} anterior no pudo ser eliminada, pero puedes continuar y generar un(a) nuev(a) ${titles.sing.toLowerCase()}. Por favor, revisa tu Google Drive para verificar si el archivo anterior fue eliminado o no.`;
          } else {
            throw new Error(
              `Error al eliminar la/el ${titles.sing.toLowerCase()} existente: ${error}`,
            ); // Detallar que el error ocurrió al eliminar la orden existente
          }
        }
      }
      setStep({
        type: "regenerating",
        message:
          message ||
          `${titles.sing} anterior eliminada. Puedes generar un(a) nuev(a) ${titles.sing.toLowerCase()}.`,
      });
      // Luego generar nueva orden
    } catch (error) {
      console.error(`Error al regenerar ${titles.sing.toLowerCase()}:`, error);
      setStep({
        type: "error",
        message: `Error al regenerar ${titles.sing.toLowerCase()}.`,
      });
    }
  };
  const onSubmit = async () => {
    if (!pdfBlob) return;
    setStep({
      type: "saving",
      message: `Guardando ${titles.sing.toLowerCase()}...`,
    });
    const fileName = generateFileName(tipo, pedido.numero_pedido);
    // Guardar el PDF en Google Drive
    // Crear registro en Hoja de calculo con el enlace al PDF
    const newOrdenTrabajo = {
      pedido_id: pedido.id,
      tipo_orden: tipo,
      cargo: getConfigOrder[tipo].cargo,
      responsable_id: responsable.id,
      responsable_nombre: responsable.nombre,
      status: "generada",
    };
    const { error } = await createNewOrdenTrabajo(
      newOrdenTrabajo as OrdenesTrabajo,
      pdfBlob,
      fileName,
      getConfigOrder[tipo].nextStatus,
    );
    if (error) {
      setStep({
        type: "error",
        message: `Error al guardar ${titles.sing.toLowerCase()}.`,
      });
    } else {
      setStep({
        type: "success",
        message: `${titles.sing} guardada correctamente.`,
      });
    }
  };
  const generateFileName = (tipo: TipoOrden, numeroPedido?: string): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const tipoPrefix: Record<string, string> = {
      fabricacion: "OT-FAB",
      pintura: "OT-PIN",
      montaje: "OT-MON",
      control_carrozado: "CC-CRZ",
    };

    const pedidoNum = numeroPedido ? `-${numeroPedido}` : "";

    return `${tipoPrefix[tipo]}-${year}${month}${day}${pedidoNum}.pdf`;
  };
  const handleCloseOrder = async () => {
    setStep({
      type: "saving",
      message: `Cerrando ${titles.sing.toLowerCase()}...`,
    });
    const { fecha_finalizado, status } = formData;
    if (!fecha_finalizado || !status) {
      setErrors({
        fecha_finalizado: !fecha_finalizado
          ? "La fecha de finalización es requerida"
          : "",
        status: !status ? "El estado final es requerido" : "",
      });
      return;
    }
    try {
      const payload = {
        id: order!.id,
        ...formData,
      };
      const { error } = await closeOrdenTrabajo(
        payload as OrdenesTrabajo,
        pedido.id,
        getConfigOrder[tipo].closeStatus,
      );
      if (error) {
        throw new Error(
          `Error al cerrar ${titles.sing.toLowerCase()}: ${error}`,
        );
      }
      setStep({
        type: "success",
        message: `${titles.sing} ha sido cerrada correctamente.`,
      });
    } catch (error) {
      setStep({
        type: "error",
        message: `Error al cerrar ${titles.sing.toLowerCase()}.`,
      });
    }
  };
  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const Header = () => {
    const Item = ({
      label,
      value,
      icon: Icon,
    }: {
      label: string;
      value: string;
      icon?: IconType;
    }) => {
      return (
        <div className="flex items-start gap-2">
          <span className="text-violet-400 dark:text-violet-400 shrink-0 mt-0.5">
            {Icon && <Icon className="size-4" />}
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-gray-300 leading-none mb-0.5">
              {label}
            </span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {value}
            </span>
          </div>
        </div>
      );
    };
    return (
      <div className="rounded-xl border border-violet-200 dark:border-violet-700/50 overflow-hidden shadow-sm">
        <div className="bg-linear-to-r from-violet-500 to-purple-600 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-100">
            Resumen del pedido
          </span>
          <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            #{pedido.numero_pedido}
          </span>
        </div>
        <div className="bg-violet-50/60 dark:bg-violet-900/20 px-4 py-3 flex flex-col gap-2.5 text-sm">
          <Item
            label="Cliente"
            value={pedido.cliente.razon_social}
            icon={LuUser}
          />
          <div className="border-t border-violet-200/60 dark:border-violet-700/30" />
          <Item
            label="Tipo de carrozado"
            value={carrozadoNombre}
            icon={LuTruck}
          />
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-4">
      {step.type === "form" && (
        <>
          <Header />
          <Select
            label="Responsable"
            options={getConfigOrder[tipo].responsableOptions}
            emptyOption="Seleccione el encargado"
            value={responsable.id}
            onChange={(e) => {
              const value = e.target.value;
              const nombreResponsable =
                getConfigOrder[tipo].responsableOptions.find(
                  (o) => o.value === value,
                )?.label || "";
              setResponsable({ id: value, nombre: nombreResponsable });
            }}
          />
          <Button
            size="sm"
            className="float-end"
            color="violet"
            outline
            onClick={handleGenerarOrden}
            disabled={!responsable.id}
          >
            Continuar
          </Button>
        </>
      )}
      {step.type === "existing" && (
        <div className="space-y-6">
          <Header />
          <Card>
            <div className="flex justify-between items-center gap-3 mb-4">
              <div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <LuCircleCheck className="text-green-500 dark:text-green-400 size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      {titles.sing} ya creada/o
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Esta/e {titles.sing.toLowerCase()} ya fue generada/o
                      anteriormente
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium ">Fecha de creación: </span>
                      <span className="ml-2">
                        {formatDateUStoES(order?.created_at)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="font-medium ">Responsable: </span>
                      <span className="ml-2">{order?.responsable_nombre}</span>
                    </div>
                    {order?.fecha_finalizado && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-medium ">
                          Fecha de finalización:{" "}
                        </span>
                        <span className="ml-2">
                          {formatDateUStoES(order?.fecha_finalizado)}
                        </span>
                      </div>
                    )}
                    <div className="w-fit text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <span className="font-medium ">Estado: </span>
                      <BadgeStatusOT status={order?.status || ""} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  as={Link}
                  to={order?.url_archivo || "#"}
                  target="_blank"
                  color={"pdf"}
                >
                  <FaFilePdf className="size-3.5 mr-1" /> Ver orden
                </Button>
                {order?.status !== "completada" && (
                  <Button
                    color={"light"}
                    size="sm"
                    onClick={() =>
                      setStep({ type: "confirmRegenerate", message: "" })
                    }
                  >
                    <TfiReload className="size-3.5 mr-1" /> Regenerar orden
                  </Button>
                )}
              </div>
            </div>
            {order?.status === "generada" && (
              <>
                <div className="border-t border-gray-300/60 dark:border-gray-700/30" />
                <div className="flex items-center gap-2 mb-3">
                  <LuTriangleAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cerrar {titles.sing.toLowerCase()}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Fecha de finalización
                      </label>
                      <Input
                        type="date"
                        placeholder="Fecha de cierre"
                        onChange={(e) =>
                          handleInputChange("fecha_finalizado", e.target.value)
                        }
                        error={errors.fecha_finalizado}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Estado final
                      </label>
                      <Select
                        options={[
                          { value: "completada", label: "Completada ✅" },
                          { value: "cancelada", label: "Cancelada ❌" },
                        ]}
                        emptyOption="Seleccione el estado final"
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                        error={errors.status}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Observaciones finales
                    </label>
                    <Textarea
                      placeholder="Notas sobre la finalización del trabajo..."
                      rows={2}
                      onChange={(e) =>
                        handleInputChange("notas", e.target.value)
                      }
                    />
                  </div>

                  <Button
                    color="violet"
                    className="w-full flex items-center justify-center gap-2"
                    outline
                    onClick={handleCloseOrder}
                  >
                    <LuArchiveX className="w-4 h-4" />
                    Cerrar {titles.sing.toLowerCase()}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
      {step.type === "saving" && <LoadingComponent message={step.message} />}
      {step.type === "preview" && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Vista previa de la orden
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Revisa la información antes de guardar
            </p>
          </div>

          {/* Vista del PDF generado */}
          {pdfBlob && pdfUrl && (
            <div className="w-full">
              <iframe
                src={pdfUrl}
                width="100%"
                height="700px"
                style={{ border: "none", borderRadius: "8px" }}
                title={`Vista previa de ${titles.sing.toLowerCase()}`}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              color="dark"
              onClick={() => setStep({ type: "form", message: "" })}
              className="flex-1"
            >
              Volver a editar
            </Button>
            <Button color="green" onClick={onSubmit} className="flex-1">
              Guardar orden
            </Button>
          </div>
        </div>
      )}
      {step.type === "success" && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
            ¡Éxito!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {step.message || "Operación realizada correctamente."}
          </p>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 underline"
            >
              Ver {titles.sing.toLowerCase()}
            </a>
          )}
        </div>
      )}
      {step.type === "error" && (
        <div className="text-center text-red-500">
          {step.message || "Ocurrió un error. Por favor, intente nuevamente."}
        </div>
      )}
      {step.type === "confirmRegenerate" && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ¿Estás seguro de que deseas regenerar {titles.sing.toLowerCase()}?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Esta acción eliminará {titles.sing.toLowerCase()} existente, y no
            podrá deshacerse.
          </p>
          <div className="flex gap-3 pt-4 w-100 mx-auto">
            <Button
              color="dark"
              onClick={() => setStep({ type: "existing", message: "" })}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              color="yellow"
              onClick={handleRegenerarOrden}
              className="flex-1"
            >
              Regenerar
            </Button>
          </div>
        </div>
      )}
      {step.type === "regenerating" && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {step.message?.includes("Error al eliminar el archivo de Drive")
              ? "Advertencia"
              : `${titles.sing} eliminada`}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {step.message?.includes("Error al eliminar el archivo de Drive")
              ? step.message
              : `El/la ${titles.sing.toLowerCase()} anterior ha sido eliminado/a. Ahora puedes generar un/a nuevo/a ${titles.sing.toLowerCase()}.`}
          </p>
          <div className="flex  pt-6 w-100 mx-auto justify-center">
            <Button
              color="green"
              onClick={() => setStep({ type: "form", message: "" })}
            >
              Generar nuevo/a {titles.sing.toLowerCase()}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
