import type { FichadaFile, FichadaFileAgrupada } from "~/types/fichadas";

function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function diffHoras(desde: Date, hasta: Date): number {
  const ms = hasta.getTime() - desde.getTime();
  if (ms <= 0) return 0;
  return Math.round((ms / 3600000) * 100) / 100;
}

export function agruparFichadasPorDia(fichadas: FichadaFile[]): FichadaFileAgrupada[] {
  const grupos = new Map<string, FichadaFile[]>();

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
    const totalHorasTrabajadas = tieneSalida
      ? diffHoras(primera.fecha, ultima.fecha)
      : 0;
    const horasRegular =
      totalHorasTrabajadas === 0
        ? 0
        : totalHorasTrabajadas >= 9.5
          ? 9.5
          : totalHorasTrabajadas;
    const horasExtras = Number((totalHorasTrabajadas-horasRegular).toFixed(2))
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
