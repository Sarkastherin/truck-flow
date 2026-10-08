import { useCallback, useState } from "react";
import { importFichadasFile } from "~/utils/importFichadas";
import type { FichadaFile, ImportError } from "~/types/fichadas";

export function useImportFichadas() {
  const [data, setData] = useState<FichadaFile[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setErrors([]);
    setData([]);
    setFileName(file.name);
    try {
      const result = await importFichadasFile(file);
      setData(result.data);
      setErrors(result.errors);
    } catch (error) {
      setData([]);
      setErrors([
        {
          row: 0,
          message:
            error instanceof Error
              ? error.message
              : "No se pudo leer el archivo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setErrors([]);
    setFileName(null);
    setIsLoading(false);
  }, []);

  return { data, errors, fileName, isLoading, parseFile, reset };
}
