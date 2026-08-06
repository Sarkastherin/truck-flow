import type { Route } from "../+types/home";
import { SubTitles } from "~/components/SubTitles";
import { useForm } from "react-hook-form";
import { FaTruckArrowRight } from "react-icons/fa6";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import { useModal } from "~/context/ModalContext";
import { useNavigate } from "react-router";
import CarroceriaUsadaForm from "~/forms/CarroceriaUsadaForm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Registrar Carrocería Usada" },
    {
      name: "description",
      content: "Bienvenido a la gestión de carrocerías usadas",
    },
  ];
}
export default function NuevaCarroceriaUsada() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SubTitles
        title="Registrar nueva carrocería usada"
        back_path="/carrocerias-usadas"
        icon={{
          component: FaTruckArrowRight,
          color: "text-cyan-600 dark:text-cyan-500",
        }}
      />
      <CarroceriaUsadaForm/>
    </div>
  );
}
