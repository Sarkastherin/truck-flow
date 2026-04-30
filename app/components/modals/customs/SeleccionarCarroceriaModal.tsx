import { TextInput, ListGroup, ListGroupItem } from "flowbite-react";
import { useEffect, useState, useMemo } from "react";
import { Spinner } from "flowbite-react";
import { useCarroceriasUsadas } from "~/context/CarroceriasUsadasContext";
import type { CarroceriaUsadaData } from "~/types/carroceria-usada";
export function SeleccionarCarroceriaModal({
  onSelect,
}: {
  onSelect: (item: CarroceriaUsadaData) => void;
}) {
  const { carroceriasUsadas, getCarroceriasUsadasData } =
    useCarroceriasUsadas();
  const [searchTerm, setSearchTerm] = useState("");
  const carroceriasDisponibles = useMemo(() => {
    return (
      carroceriasUsadas?.filter(
        (carroceria) => carroceria.status === "disponible",
      ) || []
    );
  }, [carroceriasUsadas]);
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
            filteredData.map((item) => (
              <ListGroupItem key={item.id} onClick={() => onSelect(item)}>
                <div className="flex flex-wrap flex-col md:flex-row md:justify-between items-start gap-2 w-full font-mono">
                  <span className="text-gray-600 dark:text-gray-300">
                    Modelo:{" "}
                    <span className="font-bold text-violet-500 dark:text-violet-400">
                      {item.tipo_carrozado}
                    </span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Año:{" "}
                    <span className="font-bold text-violet-500 dark:text-violet-400">
                      {item.anno_fabricacion}
                    </span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Marca:{" "}
                    <span className="font-bold text-violet-500 dark:text-violet-400">
                      {item.marca_carroceria}
                    </span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Precio lista:{" "}
                    <span className="font-bold text-violet-500 dark:text-violet-400">
                      {item.precio_lista?.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                    </span>
                  </span>
                </div>
              </ListGroupItem>
            ))
          )}
        </ListGroup>
      )}
    </div>
  );
}
