import type { Route } from "../+types/home";
import { useOutletContext } from "react-router";
import type { PedidoFormValues } from "~/types/pedido";
import { LoadingComponent } from "~/components/LoadingComponent";
import CarroceriaUsadaForm from "~/forms/CarroceriaUsadaForm";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Editar Carrocería Usada" },
    { name: "description", content: "Edita los detalles de la carrocería usada" },
  ];
}
export default function PedidosCarroceriaUsada() {
  const pedido = useOutletContext<PedidoFormValues>();

  if (pedido.id === undefined) {
    return <LoadingComponent />;
  }
  return (
    <section className="ps-4 w-full">
      <CarroceriaUsadaForm pedido={pedido} />
    </section>
  );
}
