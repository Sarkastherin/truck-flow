import { Label } from "flowbite-react";
export const formatDateTime = (value?: string) => {
  if (!value) return undefined;
  return new Date(value).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: string | boolean | undefined;
}) => {
  const displayValue =
    typeof value === "boolean"
      ? value
        ? "Activo"
        : "Inactivo"
      : value || "N/A";

  return (
    <div className="w-full">
      <div className="mb-1 block">
        <Label className="text-xs text-base-600 dark:text-base-400">
          {label}
        </Label>
      </div>
      <div className="px-3 py-2 bg-base-50 dark:bg-base-800 rounded-lg text-sm text-base-700 dark:text-base-300 border border-base-200 dark:border-base-700">
        {displayValue}
      </div>
    </div>
  );
};
