import { useState, useMemo } from "react";
import { Input } from "./InputsForm";
import { useUser } from "~/context/UserContext";
import { formatDateUStoES} from "~/backend/Database/helperTransformData"
export default function InfoFieldsComponent({
  created_at,
  created_by,
  updated_at,
  updated_by,
}: {
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}) {
  const { users } = useUser();
  const [showMore, setShowMore] = useState(false);
  const createdByName = useMemo(() => {
    if (!created_by) return "Desconocido";
    return `${users.find((user) => user.id === created_by)?.nombre} ${users.find((user) => user.id === created_by)?.apellido}`;
  }, [created_by, users]);
  const updatedByName = useMemo(() => {
    if (!updated_by) return "Desconocido";
    return `${users.find((user) => user.id === updated_by)?.nombre} ${users.find((user) => user.id === updated_by)?.apellido}`;
  }, [updated_by, users]);
  if (!created_at && !created_by && !updated_at && !updated_by) return null;
  return (
    <div className="col-span-full">
      <span
        className="text-purple-600 text-xs underline cursor-pointer"
        onClick={() => setShowMore(!showMore)}
      >
        {showMore ? "Ocultar acciones y detalles" : "Más acciones y detalles"}
      </span>
      <div
        className={`grid grid-cols-1 md:grid-cols-2 mt-4 gap-4 ${showMore ? "" : "hidden"}`}
      >
        <Input
          label="Fecha de creación"
          value={created_at ? formatDateUStoES(created_at) : ""}
          disabled
          sizing="sm"
        />
        <Input label="Creado por" value={createdByName} disabled sizing="sm" />
        <Input
          label="Fecha de última actualización"
          value={updated_at ? formatDateUStoES(updated_at) : ""}
          disabled
          sizing="sm"
        />
        <Input
          label="Actualizado por"
          value={updatedByName}
          disabled
          sizing="sm"
        />
      </div>
    </div>
  );
}
