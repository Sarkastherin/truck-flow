import type {
  Fichada,
  Liquidacion,
  LiquidacionResumen,
  Reporte,
} from "~/types/liquidaciones";
import type { Employee, Premios } from "~/types/rrhh";

export const HORAS_SEMANALES_DEFAULT = 45;
export const HORAS_JORNADA_DIARIA = 9;
export const HORA_ENTRADA = "07:00";
export const HORA_SALIDA = "16:30";
export const TOLERANCIA_MIN = 15;
export const TOLERANCIA_LLUVIA_MIN = 30;
export const HORA_ALMUERZO_INICIO = "12:00";
export const HORA_ALMUERZO_FIN = "13:00";
export const MINUTOS_ALMUERZO = 30;
export const INTERVALO_REDONDEO_MIN = 30;
export const UMBRAL_REDONDEO_MIN = INTERVALO_REDONDEO_MIN / 2;

const MINUTOS_ENTRADA = toMinutos(HORA_ENTRADA);
const MINUTOS_SALIDA = toMinutos(HORA_SALIDA);
const MINUTOS_ALMUERZO_INICIO = toMinutos(HORA_ALMUERZO_INICIO) ?? 0;
const MINUTOS_ALMUERZO_FIN = toMinutos(HORA_ALMUERZO_FIN) ?? 0;

function toMinutos(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function redondearMinutos(minutos: number): number {
  return Math.round(minutos / INTERVALO_REDONDEO_MIN) * INTERVALO_REDONDEO_MIN;
}

const pad = (n: number) => String(n).padStart(2, "0");

export const fechaAISO = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function parseLocalISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(iso.trim());
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDiaSemana(iso: string): number {
  return (parseLocalISO(iso)?.getDay() ?? 0);
}

export function calcularHorasFichada(
  entrada: string,
  salida: string | null | undefined,
  esDiaLaborable: boolean,
): {
  totalHorasTrabajadas: number;
  horasRegular: number;
  horasExtras: number;
} {
  if (!salida) {
    return { totalHorasTrabajadas: 0, horasRegular: 0, horasExtras: 0 };
  }
  const entradaMin = toMinutos(entrada);
  const salidaMin = toMinutos(salida);
  if (entradaMin === null || salidaMin === null) {
    return { totalHorasTrabajadas: 0, horasRegular: 0, horasExtras: 0 };
  }
  let diff = salidaMin - entradaMin;
  if (diff < 0) diff += 24 * 60;
  const cubreAlmuerzo =
    entradaMin <= MINUTOS_ALMUERZO_INICIO && salidaMin >= MINUTOS_ALMUERZO_FIN;
  const totalMin =
    diff - (esDiaLaborable && cubreAlmuerzo ? MINUTOS_ALMUERZO : 0);
  const totalMinRedondeado = redondearMinutos(Math.max(totalMin, 0));
  const totalHorasTrabajadas = round2(totalMinRedondeado / 60);
  const horasRegular =
    totalHorasTrabajadas === 0
      ? 0
      : totalHorasTrabajadas >= HORAS_JORNADA_DIARIA
        ? HORAS_JORNADA_DIARIA
        : totalHorasTrabajadas;
  const horasExtras = round2(totalHorasTrabajadas - horasRegular);
  return { totalHorasTrabajadas, horasRegular, horasExtras };
}

export function parseFechasISO(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((fecha) => fecha.trim())
    .filter(Boolean);
}

export function serializeFechasISO(fechas: string[]): string {
  return [...new Set(fechas)].sort().join(",");
}

export function getToleranciaMin(isLluvia: boolean): number {
  return isLluvia ? TOLERANCIA_LLUVIA_MIN : TOLERANCIA_MIN;
}

export function getHorasSemanales(liquidacion: Liquidacion): number {
  const value = Number(liquidacion.horas_semanales);
  return value > 0 ? value : HORAS_SEMANALES_DEFAULT;
}

export function getDiasPeriodo(desde: string, hasta: string): string[] {
  const start = parseLocalISO(desde);
  const end = parseLocalISO(hasta);
  if (!start || !end) return [];
  const dias: string[] = [];
  const actual = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  while (actual <= end && dias.length < 92) {
    dias.push(fechaAISO(actual));
    actual.setDate(actual.getDate() + 1);
  }
  return dias;
}

export function esFinDeSemana(iso: string): boolean {
  const day = getDiaSemana(iso);
  return day === 0 || day === 6;
}

export function getDiasLaborables(
  desde: string,
  hasta: string,
  noLaborables: string[],
): string[] {
  const excluidos = new Set(noLaborables);
  return getDiasPeriodo(desde, hasta).filter(
    (iso) => !esFinDeSemana(iso) && !excluidos.has(iso),
  );
}

export type CumplimientoEmpleado = {
  diasLaborables: number;
  faltas: number;
  tardanzas: number;
  salidasTempranas: number;
  diasIncumplidos: number;
};

export function calcularCumplimiento(
  fichadas: Fichada[],
  diasLaborables: string[],
  diasLluvia: Set<string>,
): CumplimientoEmpleado {
  const fichadasPorDia = new Map<string, Fichada>();
  for (const fichada of fichadas) {
    if (fichada.active === false) continue;
    if (!fichadasPorDia.has(fichada.fecha)) {
      fichadasPorDia.set(fichada.fecha, fichada);
    }
  }
  let faltas = 0;
  let tardanzas = 0;
  let salidasTempranas = 0;
  const diasEvento = new Set<string>();
  for (const dia of diasLaborables) {
    const fichada = fichadasPorDia.get(dia);
    if (!fichada) {
      faltas += 1;
      diasEvento.add(dia);
      continue;
    }
    const entrada = toMinutos(fichada.entrada);
    const tolerancia = getToleranciaMin(diasLluvia.has(dia));
    if (
      entrada !== null &&
      MINUTOS_ENTRADA !== null &&
      entrada > MINUTOS_ENTRADA + tolerancia
    ) {
      tardanzas += 1;
      diasEvento.add(dia);
    }
    const salida = toMinutos(fichada.salida ?? "");
    if (salida !== null && MINUTOS_SALIDA !== null && salida < MINUTOS_SALIDA) {
      salidasTempranas += 1;
      diasEvento.add(dia);
    }
  }
  return {
    diasLaborables: diasLaborables.length,
    faltas,
    tardanzas,
    salidasTempranas,
    diasIncumplidos: diasEvento.size,
  };
}

export function calcularResumenLiquidacion({
  liquidacion,
  employees,
  premios,
  fichadas,
  reportes,
}: {
  liquidacion: Liquidacion;
  employees: Employee[];
  premios: Premios[];
  fichadas: Fichada[];
  reportes: Reporte[];
}): LiquidacionResumen[] {
  const horasSemanales = getHorasSemanales(liquidacion);
  const diasLluvia = new Set(parseFechasISO(liquidacion.dias_lluvia));
  const noLaborables = parseFechasISO(liquidacion.dias_no_laborables);
  const noLaborablesSet = new Set(noLaborables);
  const diasLaborables = getDiasLaborables(
    liquidacion.desde,
    liquidacion.hasta,
    noLaborables,
  );
  const premioById = new Map(premios.map((premio) => [premio.id, premio]));

  const base = employees
    .filter((empleado) => empleado.active !== false)
    .map((empleado) => {
      const fichadasEmp = fichadas.filter(
        (fich) => fich.empleado_id === empleado.id && fich.active !== false,
      );
      const reportesEmp = reportes.filter(
        (rep) => rep.empleado_id === empleado.id && rep.active !== false,
      );
      const horasTotales = fichadasEmp.reduce((acc, fich) => {
        const esDiaLaborable =
          !esFinDeSemana(fich.fecha) && !noLaborablesSet.has(fich.fecha);
        return (
          acc +
          calcularHorasFichada(fich.entrada, fich.salida, esDiaLaborable)
            .totalHorasTrabajadas
        );
      }, 0);
      const hsRegulares = Math.min(horasTotales, horasSemanales);
      const hsExtras = Math.max(horasTotales - horasSemanales, 0);
      const vhr = Number(empleado.valor_hora_regular) || 0;
      const vhe = Number(empleado.valor_hora_extra) || 0;
      const salarioSemanal = Number(empleado.valor_salario_semanal) || 0;
      const completoSemana = horasTotales >= horasSemanales;
      const montoSalarioRegular =
        salarioSemanal > 0
          ? completoSemana
            ? salarioSemanal
            : hsRegulares * (salarioSemanal / horasSemanales)
          : hsRegulares * vhr;
      const montoSalarioExtra = hsExtras * vhe;
      const cumplimiento = calcularCumplimiento(
        fichadasEmp,
        diasLaborables,
        diasLluvia,
      );
      let carrocerias = 0;
      let montoCarrocerias = 0;
      let montoOtros = 0;
      for (const rep of reportesEmp) {
        const premio = premioById.get(rep.premio_id);
        const precio = Number(premio?.precio) || 0;
        const cantidad = Number(rep.cantidad) || 0;
        if (premio?.tipo === "carroceria") {
          carrocerias += cantidad;
          montoCarrocerias += precio * cantidad;
        } else {
          montoOtros += precio * cantidad;
        }
      }
      return {
        empleado,
        fichadas: fichadasEmp,
        reportes: reportesEmp,
        horasTotales,
        hsRegulares,
        hsExtras,
        montoSalarioRegular,
        montoSalarioExtra,
        cumplimiento,
        carrocerias,
        montoCarrocerias,
        montoOtros,
      };
    });

  const cachoRows = base.filter((row) => row.empleado.grupo === "Cacho");
  const totalPerdidosGrupo = cachoRows.reduce(
    (acc, row) => acc + row.cumplimiento.diasIncumplidos,
    0,
  );
  const totalCarroceriasGrupo = cachoRows.reduce(
    (acc, row) => acc + row.carrocerias,
    0,
  );
  const totalMontoCarroceriasGrupo = cachoRows.reduce(
    (acc, row) => acc + row.montoCarrocerias,
    0,
  );
  const cumplidores = cachoRows.filter(
    (row) => row.cumplimiento.diasIncumplidos === 0,
  );
  const recuperadoCumplidor =
    totalPerdidosGrupo > 0 &&
    totalCarroceriasGrupo > 0 &&
    cumplidores.length > 0
      ? (totalPerdidosGrupo / totalCarroceriasGrupo) *
        totalMontoCarroceriasGrupo /
        cumplidores.length
      : 0;

  return base.map((row) => {
    const isCacho = row.empleado.grupo === "Cacho";
    const perdidos = isCacho ? row.cumplimiento.diasIncumplidos : 0;
    const ganados = isCacho ? Math.max(row.carrocerias - perdidos, 0) : 0;
    const montoCacho =
      row.carrocerias > 0 ? row.montoCarrocerias * (ganados / row.carrocerias) : 0;
    const recuperado =
      isCacho && row.cumplimiento.diasIncumplidos === 0 ? recuperadoCumplidor : 0;
    const montoPremio = isCacho
      ? montoCacho + recuperado + row.montoOtros
      : row.montoCarrocerias + row.montoOtros;
    return {
      empleado: row.empleado,
      fichadas: row.fichadas,
      reportes: row.reportes,
      horas_totales: round2(row.horasTotales),
      total_horas_regulares: round2(row.hsRegulares),
      total_horas_extras: round2(row.hsExtras),
      monto_salario_regular: round2(row.montoSalarioRegular),
      monto_salario_extra: round2(row.montoSalarioExtra),
      dias_laborables: row.cumplimiento.diasLaborables,
      faltas: row.cumplimiento.faltas,
      tardanzas: row.cumplimiento.tardanzas,
      salidas_tempranas: row.cumplimiento.salidasTempranas,
      dias_incumplidos: row.cumplimiento.diasIncumplidos,
      carrocerias: row.carrocerias,
      monto_carrocerias: round2(row.montoCarrocerias),
      premios_perdidos: perdidos,
      premios_ganados: ganados,
      premio_recuperado: round2(recuperado),
      otros_premios: round2(row.montoOtros),
      monto_premio: round2(montoPremio),
    };
  });
}
