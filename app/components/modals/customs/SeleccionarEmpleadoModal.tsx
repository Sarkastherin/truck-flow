import { TextInput, ListGroup, ListGroupItem } from "flowbite-react";
import { useEffect, useState } from "react";
import { useRRHH } from "~/context/RRHHContext";
import type { Employee } from "~/types/rrhh";
import { Spinner } from "flowbite-react";
export function SeleccionarEmpleadoModal({
  onSelect,
}: {
  onSelect: (item: Employee) => void;
}) {
  
  
  const { employees, getSueldosData } = useRRHH();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<Employee[]>(employees || []);
  const [isLoading, setIsLoading] = useState(true);
  const data = employees
  useEffect(() => {
    if (!employees || employees.length === 0) {
      void getSueldosData();
    } else {
      setIsLoading(false);
      setFilteredData(data);
    }
  }, [getSueldosData, employees, data]);
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const lowercasedValue = value.toLowerCase();
    const filtered = data?.filter((item) =>
      item.nombre_completo.toLowerCase().includes(lowercasedValue),
    );
    setFilteredData(filtered || []);
  };
  return (
    <div>
      <TextInput
        type="search"
        placeholder={`Buscar empleado...`}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        autoFocus
      />
      {isLoading ? (
        <div className="flex justify-center items-center py-6">
          <Spinner aria-label="Cargando empleados..." />
        </div>
      ) : (
        <ListGroup className="mt-2 max-h-64 overflow-y-auto p-1">
          {filteredData.length === 0 ? (
            <ListGroupItem disabled>Sin resultados</ListGroupItem>
          ) : (
            filteredData.map((item) => (
              <ListGroupItem key={item.id} onClick={() => onSelect(item)}>
                <div className="flex justify-between w-full">
                  <span>{item.nombre_completo}</span>
                </div>
              </ListGroupItem>
            ))
          )}
        </ListGroup>
      )}
      
    </div>
  );
}
