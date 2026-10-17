import type { FichadaFile, FichadaFileAgrupada } from "~/types/fichadas";
import {
  calcularHorasFichada,
  esFinDeSemana,
  fechaAISO,
} from "~/utils/liquidacionCalculos";

function dayKey(date: Date): string {
  return fechaAISO(date);
}

export function agruparFichadasPorDia(
  fichadas: FichadaFile[],
  diasNoLaborables: string[] = [],
): FichadaFileAgrupada[] {
  const grupos = new Map<string, FichadaFile[]>();
  const feriados = new Set(diasNoLaborables);

  for (const fichada of fichadas) {
    const key = `${dayKey(fichada.fecha)}|${fichada.idFichada}`;
    const grupo = grupos.get(key);
    if (grupo) {
      grupo.push(fichada);
    } else {
      grupos.set(key, [fichada]);
    }
  }

  const result: FichadaFileAgrupada[] = [];

  for (const grupo of grupos.values()) {
    const ordenadas = [...grupo].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime(),
    );
    const primera = ordenadas[0];
    const ultima = ordenadas[ordenadas.length - 1];
    const tieneSalida = ordenadas.length > 1;
    const iso = fechaAISO(primera.fecha);
    const esDiaLaborable = !esFinDeSemana(iso) && !feriados.has(iso);
    const { totalHorasTrabajadas, horasRegular, horasExtras } =
      calcularHorasFichada(
        primera.hora,
        tieneSalida ? ultima.hora : null,
        esDiaLaborable,
      );
    result.push({
      fecha: new Date(
        primera.fecha.getFullYear(),
        primera.fecha.getMonth(),
        primera.fecha.getDate(),
      ),
      dniEmpleado: primera.idFichada,
      entrada: primera.hora,
      salida: tieneSalida ? ultima.hora : null,
      totalHorasTrabajadas,
      horasRegular,
      horasExtras,
      active: true,
    });
  }

  result.sort(
    (a, b) =>
      a.fecha.getTime() - b.fecha.getTime() ||
      a.dniEmpleado.localeCompare(b.dniEmpleado),
  );

  return result;
}
