import { useEffect } from "react";
import type { FichadaFile } from "~/types/fichadas";
import { agruparFichadasPorDia } from "~/utils/agruparFichadas";
import { useRRHH } from "~/context/RRHHContext";
import type { FichadasFileUI, StepsType } from "~/routes/rrhh/$liquidacionId";
import { ImportFichadasButton } from "../ImportFichadasButton";

export default function Import({
  setIsLoadingImport,
  setFichadasFile,
  setStep,
}: {
  setIsLoadingImport: React.Dispatch<React.SetStateAction<boolean>>;
  setFichadasFile: React.Dispatch<React.SetStateAction<FichadasFileUI[]>>;
  setStep: React.Dispatch<React.SetStateAction<StepsType>>;
}) {
  const { getSueldosData, employees, isReady } = useRRHH();
  useEffect(() => {
    if (employees.length === 0 && !isReady) getSueldosData();
  }, [isReady, employees, getSueldosData]);
  const handleImport = (data: FichadaFile[]) => {
    setIsLoadingImport(true);
    const liquidacion = agruparFichadasPorDia(data);
    const liquidacionWithEmpleado = liquidacion.map((liq) => {
      const empleado = employees.find((emp) => emp.dni == liq.dniEmpleado);
      return { empleado, ...liq };
    });
    setFichadasFile(liquidacionWithEmpleado);
    setIsLoadingImport(false);
    setStep("load");
  };
  return (
    <div
      className="flex flex-col justify-center items-center w-full gap-4"
      style={{ minHeight: "calc(100vh - 300px" }}
    >
      <p>Ingresa el archivo de fichadas para ser procesado</p>
      <ImportFichadasButton onImport={handleImport} />
    </div>
  );
}
