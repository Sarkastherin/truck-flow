import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Button,
  ToggleSwitch,
} from "flowbite-react";
import { Modal } from "~/components/modals/ModalBase";
import { Input } from "~/components/InputsForm";
import type { Liquidacion } from "~/types/liquidaciones";
import {
  HORAS_SEMANALES_DEFAULT,
  esFinDeSemana,
  getDiaSemana,
  getDiasPeriodo,
  parseFechasISO,
  serializeFechasISO,
} from "~/utils/liquidacionCalculos";

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type ConfigSemanaValues = {
  horas_semanales: number;
  dias_lluvia: string;
  dias_no_laborables: string;
};

export default function ConfigurarSemanaModal({
  show,
  liquidacion,
  isSaving,
  onSave,
  onClose,
}: {
  show: boolean;
  liquidacion: Liquidacion | null;
  isSaving: boolean;
  onSave: (config: ConfigSemanaValues) => void;
  onClose: () => void;
}) {
  const [horas, setHoras] = useState(String(HORAS_SEMANALES_DEFAULT));
  const [lluvia, setLluvia] = useState<Set<string>>(new Set());
  const [noLaborables, setNoLaborables] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!show || !liquidacion) return;
    const value = Number(liquidacion.horas_semanales);
    setHoras(String(value > 0 ? value : HORAS_SEMANALES_DEFAULT));
    setLluvia(new Set(parseFechasISO(liquidacion.dias_lluvia)));
    setNoLaborables(new Set(parseFechasISO(liquidacion.dias_no_laborables)));
  }, [show, liquidacion]);

  const dias = liquidacion
    ? getDiasPeriodo(liquidacion.desde, liquidacion.hasta)
    : [];

  const toggleSet = (
    setter: Dispatch<SetStateAction<Set<string>>>,
    iso: string,
  ) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(iso)) {
        next.delete(iso);
      } else {
        next.add(iso);
      }
      return next;
    });
  };

  const handleSave = () => {
    const value = Number(horas);
    onSave({
      horas_semanales: value > 0 ? value : HORAS_SEMANALES_DEFAULT,
      dias_lluvia: serializeFechasISO([...lluvia]),
      dias_no_laborables: serializeFechasISO([...noLaborables]),
    });
  };

  return (
    <Modal
      open={show && Boolean(liquidacion)}
      title="Configurar semana"
      size="2xl"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button color="alternative" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button color="indigo" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Input
            label="Horas semanales"
            type="number"
            step="0.5"
            min={1}
            allowDecimal
            value={horas}
            onChange={(event) => setHoras(event.target.value)}
          />
          <p className="mt-1 text-xs text-base-500 dark:text-base-400">
            Ajustá el total si hay feriados u otros días no laborables
          </p>
        </div>
        <div className="rounded-lg border border-base-200 bg-base-50 p-3 dark:border-base-700 dark:bg-base-800">
          <p className="mb-1 text-sm font-semibold text-base-700 dark:text-base-200">
            Días del período
          </p>
          <p className="mb-3 text-xs text-base-500 dark:text-base-400">
            La tolerancia de llegada es de 15' y de 30' en días de lluvia. Los
            fines de semana y los días marcados como no laborables no se esperan
            fichadas.
          </p>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {dias.map((iso) => {
              const finDeSemana = esFinDeSemana(iso);
              const [anio, mes, dia] = iso.split("-");
              return (
                <li
                  key={iso}
                  className={`flex items-center justify-between gap-2 rounded-md bg-white px-3 py-1.5 text-sm dark:bg-base-900 ${
                    finDeSemana ? "opacity-60" : ""
                  }`}
                >
                  <span className="text-base-700 dark:text-base-200">
                    {DIAS_CORTOS[getDiaSemana(iso)]} {dia}/{mes}/{anio}
                    {finDeSemana && (
                      <span className="ms-2 text-xs text-base-400">
                        (fin de semana)
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <ToggleSwitch
                      checked={lluvia.has(iso)}
                      onChange={() => toggleSet(setLluvia, iso)}
                      label="Lluvia"
                      sizing="sm"
                      disabled={finDeSemana || isSaving}
                    />
                    <ToggleSwitch
                      checked={noLaborables.has(iso)}
                      onChange={() => toggleSet(setNoLaborables, iso)}
                      label="No laborable"
                      sizing="sm"
                      disabled={finDeSemana || isSaving}
                    />
                  </span>
                </li>
              );
            })}
            {dias.length === 0 && (
              <li className="py-6 text-center text-sm text-base-500 dark:text-base-400">
                La liquidación no tiene un período válido cargado
              </li>
            )}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
