import type { Route } from "../+types/home";
import { useOutletContext } from "react-router";
import type { PedidoFormValues } from "~/types/pedido";
import DatosColocacion from "~/forms/DatosColocacionForm";
import { Button } from "flowbite-react";
import { useNavigate } from "react-router";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Editar Colocación" },
    { name: "description", content: "Edita los detalles de la colocación" },
  ];
}
export default function PedidosDatosColocacion() {
  const pedido = useOutletContext() as PedidoFormValues;
  const navigate = useNavigate();
  return (
    <section className="ps-4 w-full">
      {pedido && pedido.carroceria?.id ? (
        <DatosColocacion pedido={pedido} />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 115px)" }}
        >
          <div className="flex flex-col gap-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              No hay carrocería asociada a este pedido.
            </p>
            <Button
              color={"violet"}
              className="w-fit mx-auto"
              onClick={() => navigate(`/pedidos/carroceria/${pedido.id}`)}
            >
              Agregar Carrocería
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
