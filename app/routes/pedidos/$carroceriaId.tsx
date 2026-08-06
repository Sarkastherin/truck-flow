import type { Route } from "../+types/home";
import { useOutletContext } from "react-router";
import type { Documentos, PedidoFormValues } from "~/types/pedido";
import CarroceriaForm from "~/forms/CarroceriaForm";
import { LoadingComponent } from "~/components/LoadingComponent";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Editar Carrocería" },
    { name: "description", content: "Edita los detalles de la carroceria" },
  ];
}
export default function PedidosCarroceria() {
  const pedido = useOutletContext<PedidoFormValues>();

  if (pedido.id === undefined) {
    return <LoadingComponent />;
  }
  return (
    <section className="ps-4 w-full">
      <CarroceriaForm pedido={pedido} />
    </section>
  );
}
