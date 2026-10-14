import { Alert, Button, FileInput, Label, Spinner } from "flowbite-react";
import { useRef, useState, type ChangeEvent } from "react";
import { LuTrash2, LuUpload } from "react-icons/lu";
import { useImportFichadas } from "~/hooks/useImportFichadas";
import type { FichadaFile } from "~/types/fichadas";

const MAX_ERRORS_SHOWN = 20;

export function ImportFichadasButton({
  onImport,
}: {
  onImport: (rows: FichadaFile[]) => void;
}) {
  const { data, errors, fileName, isLoading, parseFile, reset } =
    useImportFichadas();
  const inputRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTouched(true);
    await parseFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClear = () => {
    setTouched(false);
    reset();
  };

  const handleImport = () => {
    onImport(data);
  };

  const ok = touched && errors.length === 0 && data.length > 0;
  const shownErrors = errors.slice(0, MAX_ERRORS_SHOWN);

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <div>
        <Label className="mb-1 block" htmlFor="fichadas-file">
          Importar reporte de fichadas (.csv / .xlsx)
        </Label>
        <FileInput
          id="fichadas-file"
          ref={inputRef}
          accept=".csv, .xlsx, .xls, .txt"
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-base-500">
          <Spinner aria-label="Procesando archivo..." size="sm" />
          <span>Procesando {fileName}…</span>
        </div>
      )}

      {touched && !isLoading && errors.length > 0 && (
        <Alert color="failure">
          <span className="font-semibold">
            El archivo tiene errores de estructura ({errors.length}) y no se
            puede importar:
          </span>
          <ul className="mt-2 list-disc list-inside text-sm">
            {shownErrors.map((error, index) => (
              <li key={`${error.row}-${index}`}>
                {error.row > 0 ? `Fila ${error.row}: ` : ""}
                {error.message}
              </li>
            ))}
          </ul>
          {errors.length > MAX_ERRORS_SHOWN && (
            <span className="mt-1 text-sm">
              …y {errors.length - MAX_ERRORS_SHOWN} errores más.
            </span>
          )}
        </Alert>
      )}

      {ok && (
        <Alert color="success">
          <span>
            {fileName}: {data.length} fichada{data.length === 1 ? "" : "s"}{" "}
            validada{data.length === 1 ? "" : "s"} correctamente.
          </span>
        </Alert>
      )}

      {touched && !isLoading && (
        <div className="absolute bottom-10 left-0 w-full">
          <div className=" px-10 flex justify-between">
            <Button color="dark" onClick={handleClear}>
              Limpiar
            </Button>
            <Button color="yellow" onClick={handleImport}>
              Usar fichadas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
