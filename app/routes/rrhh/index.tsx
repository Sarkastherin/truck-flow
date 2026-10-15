import type { Route } from "../+types/home";
import { Card, Button } from "flowbite-react";
import { NavLink, useNavigate } from "react-router";
import { useNavItems } from "~/hooks/useNavItems";
import { SubTitles } from "~/components/SubTitles";
import { GrupoDeRrhhIcon } from "~/components/icons/GrupoDeRrhhIcon";
import { useModal } from "~/context/ModalContext";
import LiquidacionModal from "~/components/modals/customs/LiquidacionModal";
import { useLiquidacion } from "~/hooks/useLiquidacion";
import { useEffect } from "react";
import { useRRHH } from "~/context/RRHHContext";
import { LoadingComponent } from "~/components/LoadingComponent";
import { SeleccionarLiquidacionModal } from "~/components/modals/customs/SeleccionarLiquidacionModal";
import type { Liquidacion } from "~/types/liquidaciones";
//import { MODE_DEV } from "~/backend/Database/SheetsConfig";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RRHH" },
    { name: "description", content: "Recursos Humanos" },
  ];
}
const MODE_DEV = true
export default function RRHH() {
  const navigate = useNavigate();
  const { rrhhItems } = useNavItems();
  const { openModal, closeModal } = useModal();
  const { form, onCreate } = useLiquidacion();
  const { getSueldosData, isReady } = useRRHH();

  useEffect(() => {
    if (!isReady) getSueldosData();
  }, [isReady, getSueldosData]);
  const handleCreateLiquidacion = () => {
    let newId: string | null = null;
    form.reset({
      desde: "",
      hasta: "",
      status: "nueva",
    });
    form.clearErrors();
    openModal("form", {
      component: LiquidacionModal,
      props: {
        title: `Asignar periodo a liquidación`,
        form,
        size: "2xl",
      },
      onSubmit: form.handleSubmit(async (data) => {
        const newLiquidacion = await onCreate(data);
        if (newLiquidacion?.id) newId = newLiquidacion.id;
      }),
      onCloseCustom: () => {
        navigate(`/rrhh/liquidacion/${newId}`);
        closeModal();
      },
    });
  };
  const handleSelectLiquidacion = (liquidacion: Liquidacion) => {
    navigate(`/rrhh/liquidacion/${liquidacion.id}`);
    closeModal();
  };
  const handleOpenSearchLiquidacionModal = () => {
    openModal("custom", {
      title: `Seleccionar liquidación`,
      component: SeleccionarLiquidacionModal,
      onSelect: handleSelectLiquidacion,
      size: "xl",
    });
  };
  if (!isReady) return <LoadingComponent message="Obteniendo datos..." />;

  return (
    <>
      <SubTitles
        title="Recursos Humanos"
        back_path="/"
        icon={{
          component: GrupoDeRrhhIcon,
          color: "text-purple-600 dark:text-purple-400",
        }}
      />
      {MODE_DEV && (
        <Card className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            <Button onClick={handleCreateLiquidacion}>
              Nueva liquidación
            </Button>
            <Button onClick={handleOpenSearchLiquidacionModal} color="light">
              Liquidación en proceso
            </Button>
            <Button onClick={() => {}} color="light">
              Historial de liquidaciones
            </Button>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-15 auto-rows-fr">
        {rrhhItems.map(
          ({ path, name, description, icon: { component: Icon, color }, hidden }) => (
            <NavLink key={path} to={path} hidden={hidden}>
              <Card className="hover:shadow-2xl hover:scale-105 hover:bg-base-50 dark:hover:bg-base-800 transition-all duration-200 h-full flex flex-col cursor-pointer">
                <div className="flex items-center space-x-4">
                  <Icon className={`text-2xl ${color}`} />
                  <h2 className="text-xl font-semibold">{name}</h2>
                </div>
                <p className="text-base-500 dark:text-base-400">
                  {description}
                </p>
              </Card>
            </NavLink>
          ),
        )}
      </div>
    </>
  );
}
