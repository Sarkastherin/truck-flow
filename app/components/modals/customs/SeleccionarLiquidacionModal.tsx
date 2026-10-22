import { TextInput, ListGroup, ListGroupItem, Spinner } from "flowbite-react";
import { useEffect, useState } from "react";
import {
  LuArrowRight,
  LuCalendarDays,
  LuChevronRight,
  LuInbox,
  LuSearch,
} from "react-icons/lu";
import { useRRHH } from "~/context/RRHHContext";
import type { Liquidacion } from "~/types/liquidaciones";
import { BadgeStatusLiq } from "~/components/specials/Badges";
import { formatDateUStoES } from "~/utils/formats";

export function getDiasPeriodo(desde: string, hasta: string) {
  const start = new Date(desde);
  const end = new Date(hasta);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const dias = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return dias > 0 ? dias : null;
}

export function SeleccionarLiquidacionModal({
  onSelect,
}: {
  onSelect: (item: Liquidacion) => void;
}) {
  const { liquidaciones, getSueldosData } = useRRHH();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<Liquidacion[]>(
    liquidaciones || [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const data = liquidaciones;
  useEffect(() => {
    if (!liquidaciones || liquidaciones.length === 0) {
      void getSueldosData();
    } else {
      setIsLoading(false);
      setFilteredData(data.filter((liq) => liq.status !== "cerrada"));
    }
  }, [getSueldosData, liquidaciones, data]);
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const lowercasedValue = value.toLowerCase();
    const filtered = data?.filter(
      (item) =>
        item.status !== "cerrada" &&
        (item.desde.toLowerCase().includes(lowercasedValue) ||
          item.hasta.toLowerCase().includes(lowercasedValue)),
    );
    setFilteredData(filtered || []);
  };
  return (
    <div>
      <div className="relative">
        <LuSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-400" />
        <TextInput
          type="search"
          className="pl-9"
          placeholder="Buscar por fecha del periodo..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-6">
          <Spinner aria-label="Cargando liquidaciones..." />
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs text-base-500 dark:text-base-300">
            {filteredData.length === 0
              ? "Sin liquidaciones disponibles"
              : `${filteredData.length} liquidación${filteredData.length === 1 ? "" : "es"} disponible${filteredData.length === 1 ? "" : "s"}`}
          </p>
          <ListGroup className="mt-1 max-h-64 overflow-y-auto p-1 dark:bg-base-800">
            {filteredData.length === 0 ? (
              <ListGroupItem disabled className="justify-center">
                <div className="flex flex-col items-center gap-1 py-2 text-base-400">
                  <LuInbox className="size-6" />
                  <span className="text-sm">Sin resultados</span>
                </div>
              </ListGroupItem>
            ) : (
              filteredData.map((item) => {
                const dias = getDiasPeriodo(item.desde, item.hasta);
                return (
                  <ListGroupItem
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="cursor-pointer transition-colors hover:bg-primary-50 dark:hover:bg-base-700/60"
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-indigo-500 text-white shadow-sm shadow-primary-500/30">
                          <LuCalendarDays className="size-5" />
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-1.5 font-semibold text-base-800 dark:text-base-100">
                            {formatDateUStoES(item.desde)}
                            <LuArrowRight className="size-3.5 shrink-0 text-base-400" />
                            {formatDateUStoES(item.hasta)}
                          </span>
                          <span className="text-xs text-base-500 dark:text-base-400">
                            {dias
                              ? `Periodo de ${dias} día${dias === 1 ? "" : "s"}`
                              : "Periodo"}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <BadgeStatusLiq status={item.status} />
                        <LuChevronRight className="size-4 text-base-400" />
                      </div>
                    </div>
                  </ListGroupItem>
                );
              })
            )}
          </ListGroup>
        </>
      )}
    </div>
  );
}
