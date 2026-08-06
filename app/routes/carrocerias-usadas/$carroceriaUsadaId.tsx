import type { Route } from "../+types/home";
import CarroceriaUsadaForm from "~/forms/CarroceriaUsadaForm";
import { useParams } from "react-router";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { LoadingComponent } from "~/components/LoadingComponent";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Carrocerías Usadas" },
    {
      name: "description",
      content: "Bienvenido a la gestión de carrocerías usadas",
    },
  ];
}
export default function CarroceriaUsadaDetalle() {
  const { carroceriasUsadas } = useCarroceriasUsadas();
  const { carroceriaUsadaId } = useParams();
  const carroceriaUsada = carroceriasUsadas?.find(
    (c) => c.id === carroceriaUsadaId,
  );
  if (!carroceriaUsada) {
    return <LoadingComponent />;
  }
  return <CarroceriaUsadaForm data={carroceriaUsada} />;
}
