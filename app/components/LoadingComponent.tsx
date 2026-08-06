import { Spinner } from "flowbite-react";
export const LoadingComponent = ({ message }: { message?: string }) => {
  return (
    <div className="min-h-100 w-full flex flex-col justify-center items-center gap-2">
      <Spinner aria-label="Cargando..." />
      {message && <span className="text-sm text-gray-500">{message}</span>}
    </div>
  );
};
