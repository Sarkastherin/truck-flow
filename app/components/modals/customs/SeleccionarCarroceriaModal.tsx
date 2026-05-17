import { TextInput, ListGroup, ListGroupItem } from "flowbite-react";
import { useEffect, useState, useMemo } from "react";
import { Spinner } from "flowbite-react";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
export function SeleccionarCarroceriaModal({
  onSelect,
  mode,
  clienteId,
}: {
  onSelect: (item: CarroceriaUsadaData) => void;
  mode?: "prestamo" | "asignacion";
  clienteId?: string;
}) {
  const { carroceriasUsadas, getCarroceriasUsadasData } =
    useCarroceriasUsadas();
  const [searchTerm, setSearchTerm] = useState("");
  const carroceriasDisponibles = useMemo(() => {
    if (mode === "prestamo") {
      return (
        carroceriasUsadas?.filter(
          (carroceria) =>
            carroceria.status === "disponible" &&
            carroceria.duenno_id !== clienteId,
        ) || []
      );
    } 
    else if (mode === "asignacion") {
      return (
        carroceriasUsadas?.filter(
          (carroceria) =>
            carroceria.status === "disponible" &&
            carroceria.duenno_id === clienteId,
        ) || []
      );
    }
    else {
      return (
        carroceriasUsadas?.filter(
          (carroceria) => carroceria.status === "disponible",
        ) || []
      );
    }
  }, [carroceriasUsadas, clienteId]);
  const [filteredData, setFilteredData] = useState<CarroceriaUsadaData[]>(
    carroceriasDisponibles || [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!carroceriasUsadas || carroceriasUsadas.length === 0) {
      void getCarroceriasUsadasData();
    } else {
      setIsLoading(false);
      setFilteredData(carroceriasDisponibles);
    }
  }, [getCarroceriasUsadasData, carroceriasUsadas]);
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const lowercasedValue = value.toLowerCase();
    const filtered = carroceriasDisponibles?.filter((item) =>
      item.tipo_carrozado.toLowerCase().includes(lowercasedValue),
    );
    setFilteredData(filtered || []);
  };
  const ListItemComponent = ({
    label,
    item,
    className,
  }: {
    label: string;
    item: string | number;
    className?: string;
  }) => {
    return (
      <div
        className={`flex flex-col justify-start items-start ${className && className}`}
      >
        <span className="font-bold text-[0.8rem] text-violet-500 dark:text-violet-400">
          {label}:{" "}
        </span>
        <span className="text-gray-700 dark:text-gray-300">{item}</span>
      </div>
    );
  };
  return (
    <div>
      <TextInput
        type="search"
        placeholder="Buscar carrocería usada..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        autoFocus
      />
      {isLoading ? (
        <div className="flex justify-center items-center py-6">
          <Spinner aria-label="Cargando carrocerías usadas..." />
        </div>
      ) : (
        <ListGroup className="mt-2 max-h-64 overflow-y-auto p-1">
          {filteredData.length === 0 ? (
            <ListGroupItem disabled>Sin resultados</ListGroupItem>
          ) : (
            filteredData.map((item, index) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`${index % 2 === 0 ? "bg-gray-100/80 dark:bg-gray-950/30" : ""} flex flex-col md:flex-row font-mono gap-2 rounded p-2 hover:bg-violet-200/50 dark:hover:bg-violet-950/50 cursor-pointer`}
              >
                <ListItemComponent
                  label="Número"
                  item={item.numero_carroceria}
                  className="w-18"
                />
                <ListItemComponent
                  label="Propietario anterior"
                  item={item.duenno?.razon_social || ""}
                  className="min-w-50 max-w-50"
                />
                <ListItemComponent
                  label="Modelo"
                  item={`${item.tipo_carrozado} | marca: ${item.marca_carroceria || "N/A"} | año: ${item.anno_fabricacion || "N/A"}`}
                />
              </div>
            ))
          )}
        </ListGroup>
      )}
    </div>
  );
}
