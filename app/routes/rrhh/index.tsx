import type { Route } from "../+types/home";
import { Card } from "flowbite-react";
import { NavLink, useNavigate } from "react-router";
import { LuClock, LuFilePlus, LuHistory } from "react-icons/lu";
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
import { HORAS_SEMANALES_DEFAULT } from "~/utils/liquidacionCalculos";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RRHH" },
    { name: "description", content: "Recursos Humanos" },
  ];
}
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
      horas_semanales: HORAS_SEMANALES_DEFAULT,
      bono_quincenal: false,
      dias_lluvia: "",
      dias_no_laborables: "",
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <button type="button" onClick={handleCreateLiquidacion} className="text-left w-full">
          <Card className="hover:shadow-2xl hover:scale-105 hover:bg-base-50 dark:hover:bg-base-800 transition-all duration-200 h-full cursor-pointer">
            <div className="flex items-center gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/30">
                <LuFilePlus className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-base-800 dark:text-base-100">
                  Nueva liquidación
                </h2>
                <p className="text-sm text-base-500 dark:text-base-400">
                  Crea y configura un nuevo periodo
                </p>
              </div>
            </div>
          </Card>
        </button>
        <button
          type="button"
          onClick={handleOpenSearchLiquidacionModal}
          className="text-left w-full"
        >
          <Card className="hover:shadow-2xl hover:scale-105 hover:bg-base-50 dark:hover:bg-base-800 transition-all duration-200 h-full cursor-pointer">
            <div className="flex items-center gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 text-white shadow-sm shadow-yellow-500/30">
                <LuClock className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-base-800 dark:text-base-100">
                  Liquidación en proceso
                </h2>
                <p className="text-sm text-base-500 dark:text-base-400">
                  Continuá una liquidación abierta
                </p>
              </div>
            </div>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => navigate("/rrhh/liquidacion/historial")}
          className="text-left w-full"
        >
          <Card className="hover:shadow-2xl hover:scale-105 hover:bg-base-50 dark:hover:bg-base-800 transition-all duration-200 h-full cursor-pointer">
            <div className="flex items-center gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-sm shadow-green-500/30">
                <LuHistory className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-base-800 dark:text-base-100">
                  Historial de liquidaciones
                </h2>
                <p className="text-sm text-base-500 dark:text-base-400">
                  Consultá las liquidaciones completadas
                </p>
              </div>
            </div>
          </Card>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-15 auto-rows-fr">
        {rrhhItems.map(
          ({
            path,
            name,
            description,
            icon: { component: Icon, color },
            hidden,
          }) => (
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
