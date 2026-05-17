import { Button } from "flowbite-react";
import { PiHandArrowDownBold } from "react-icons/pi";
import { useModal } from "~/context/ModalContext";
import { SeleccionarCarroceriaModal } from "../modals/customs/SeleccionarCarroceriaModal";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import { usePrestamo } from "~/hooks/usePrestamo";
import type { Pedido } from "~/types/pedido";
import { PrestarCarroceriaModal } from "../modals/customs/PrestarCarroceriaModal";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { useMemo } from "react";
export default function ButtonPrestamo({ pedido }: { pedido: Pedido }) {
  const { carroceriasUsadas } = useCarroceriasUsadas();
  const { form, onCreate, onUpdate } = usePrestamo();
  const { openModal, closeModal } = useModal();
  const handleSelectCarroceria = () => {
    openModal("custom", {
      title: "Seleccionar Carrocería Usada",
      component: SeleccionarCarroceriaModal,
      mode: "prestamo",
      clienteId: pedido.cliente_id,
      onSelect: (item: CarroceriaUsadaData) => {
        handleSelectCarroceriaUsada(item);
      },
      size: "4xl",
    });
  };
  const handleSelectCarroceriaUsada = (item: CarroceriaUsadaData) => {
    openModal("confirmation", {
      props: {
        title: "Confirmar Asignación",
        message: (
          <>
            Se asiganará en forma de prestamo la carrocería usada{" "}
            <strong>{item.tipo_carrozado}</strong> al pedido. ¿Deseas continuar?
          </>
        ),
        onConfirm: () => {
          closeModal();
          handleOpenFormPrestamo(item);
        },
        confirmText: "Sí, asignar",
      },
    });
  };
  const handleOpenFormPrestamo = (carroceriaUsada: CarroceriaUsadaData) => {
    const newForm = form;
    newForm.reset({
      carroceria_usada_id: carroceriaUsada.id,
      pedido_id: pedido.id,
      cliente_id: pedido.cliente_id,
      fecha_prestamo: new Date().toISOString().split("T")[0],
      fecha_devolucion: "",
      notas_prestamo: "",
    });
    openModal("form", {
      component: PrestarCarroceriaModal,
      props: {
        form: newForm,
        title: "Registrar préstamo de carrocería usada",
      },
      onSubmit: form.handleSubmit(onCreate),
    });
  };
  const prestamoAsignado = useMemo(() => {
    if (!pedido.prestamo_id || !carroceriasUsadas) return null;
    return carroceriasUsadas.find((c) => c.prestamo?.id === pedido.prestamo_id);
  }, [pedido.prestamo_id, carroceriasUsadas]);
  //if (!prestamoAsignado) return null;

  const handleOpenDetailsPrestamo = () => {
    if(!prestamoAsignado) return;
    const newForm = form;
    newForm.reset(prestamoAsignado.prestamo!);
    openModal("form", {
      component: PrestarCarroceriaModal,
      props: {
        form: newForm,
        title: "Datos del préstamo",
        carroceriaData: prestamoAsignado,
      },
      onSubmit: form.handleSubmit(onUpdate),
    });
  };
  const handleOpenDevolucionPrestamo = () => {
    if(!prestamoAsignado) return;
    const newForm = form;
    newForm.reset(prestamoAsignado.prestamo!);
    openModal("form", {
      component: PrestarCarroceriaModal,
      props: {
        form: newForm,
        title: "Devolución de carrocería usada",
        carroceriaData: prestamoAsignado,
        isDevolucion: true,
      },
      onSubmit: form.handleSubmit(onUpdate),
    });
  };
  return (
    <>
      {(pedido.prestamo_id && prestamoAsignado) ? (
        <>
          {!prestamoAsignado.prestamo?.fecha_devolucion ? (
            <div className="my-4 p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                  Prestamo asignado
                </h4>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-300 mb-3 leading-relaxed">
                Este pedido tiene un préstamo de carrocería usada asignado.
              </p>
              <Button
                type="button"
                color="yellow"
                size="sm"
                onClick={handleOpenDetailsPrestamo}
                className="w-full text-xs"
              >
                {"Ver detalles del préstamo"}
              </Button>
              <Button
                type="button"
                color="dark"
                size="sm"
                onClick={handleOpenDevolucionPrestamo}
                className="w-full text-xs mt-2"
              >
                {"Devolución de carrocería usada"}
              </Button>
            </div>
          ) : (
            <div className="my-4 p-3 border border-lime-200 dark:border-lime-800 rounded-lg bg-lime-50 dark:bg-lime-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-lime-500 rounded-full"></div>
                <h4 className="text-sm font-semibold text-lime-700 dark:text-lime-400">
                  Prestamo cerrado
                </h4>
              </div>
              <p className="text-xs text-lime-600 dark:text-lime-300 mb-3 leading-relaxed">
                Este pedido tiene un préstamo de carrocería usada que ha sido cerrado por devolución.
              </p>
              <Button
                type="button"
                color="lime"
                size="sm"
                onClick={handleOpenDetailsPrestamo}
                className="w-full text-xs"
              >
                {"Ver detalles del préstamo"}
              </Button>
              
            </div>
          )}
        </>
      ) : (
        <Button
          size="sm"
          color={"violet"}
          outline
          className="w-full mt-4 flex items-center justify-center gap-2"
          onClick={handleSelectCarroceria}
        >
          <PiHandArrowDownBold className="size-5" />
          Prestar carrocería
        </Button>
      )}
    </>
  );
}
