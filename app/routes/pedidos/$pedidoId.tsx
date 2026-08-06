import type { Route } from "../+types/home";
import PedidosForm from "~/forms/PedidosForm";
import { useOutletContext } from "react-router";
import type { PedidoFormValues } from "~/types/pedido";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Editar Pedido" },
    { name: "description", content: "Edita los detalles del pedido" },
  ];
}
export default function PedidosPedido() {
  const pedido = useOutletContext() as PedidoFormValues;
  return (
    <section className="ps-4 w-full">
      <PedidosForm data={pedido} />
    </section>
  );
}
