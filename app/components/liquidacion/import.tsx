import { useEffect } from "react";
import type { FichadaFile, FichadasFileUI } from "~/types/fichadas";
import { agruparFichadasPorDia } from "~/utils/agruparFichadas";
import { useRRHH } from "~/context/RRHHContext";
import { ImportFichadasButton } from "../ImportFichadasButton";

export default function Import({
  setIsLoadingImport,
  setFichadasFile,
  onProcessed,
}: {
  setIsLoadingImport: React.Dispatch<React.SetStateAction<boolean>>;
  setFichadasFile: React.Dispatch<React.SetStateAction<FichadasFileUI[]>>;
  onProcessed: () => void;
}) {
  const { employees, isReady, getSueldosData } = useRRHH();
  useEffect(() => {
    if (employees.length === 0 && !isReady) getSueldosData();
  }, [isReady, employees, getSueldosData]);
  const handleImport = (data: FichadaFile[]) => {
    setIsLoadingImport(true);
    const agrupadas = agruparFichadasPorDia(data);
    const rows = agrupadas.map((liq) => {
      const empleado = employees.find((emp) => emp.dni == liq.dniEmpleado);
      return { empleado, ...liq };
    });
    setFichadasFile(rows);
    setIsLoadingImport(false);
    onProcessed();
  };
  return (
    <div
      className="flex flex-col justify-center items-center w-full gap-4"
      style={{ minHeight: "calc(100vh - 300px" }}
    >
      <ImportFichadasButton onImport={handleImport} />
    </div>
  );
}
