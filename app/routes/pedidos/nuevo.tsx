import { SubTitles } from "~/components/SubTitles";
import PedidosForm from "~/forms/PedidosForm";
import { LuBookPlus } from "react-icons/lu";
export default function NuevoPedido() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SubTitles title="Nuevo pedido" back_path="/" icon={{ component: LuBookPlus, color: "text-blue-500" }} />
      <PedidosForm />
    </div>
  );
}
