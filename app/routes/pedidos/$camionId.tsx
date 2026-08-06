import type { Route } from "../+types/home";
import { useOutletContext } from "react-router";
import type { PedidoFormValues } from "~/types/pedido";
import CamionForm from "~/forms/CamionForm";
import { LoadingComponent } from "~/components/LoadingComponent";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Editar Camión" },
    { name: "description", content: "Edita los detalles del camión" },
  ];
}
export default function PedidosCamion() {
  const pedido = useOutletContext<PedidoFormValues>();

  if (pedido.id === undefined) {
    return <LoadingComponent />;
  }
  return (
    <section className="ps-4 w-full">
      <CamionForm pedido={pedido} />
    </section>
  );
}
