import { Button, FileInput, Label } from "flowbite-react";
import type { ChangeEvent } from "react";
import { LuFileText, LuTrash2 } from "react-icons/lu";
export type TipoDocumento =
  | "camion"
  | "carroceria"
  | "movimiento"
  | "carroceria_usada";
export type FileTypeActions<T> = {
  add: FileList | null;
  remove: T[] | null;
};
export function FileInputComponent<
  T extends {
    id: string;
    tipo_documento: TipoDocumento;
    nombre?: string;
    url: string;
  },
>({
  tipoDocumento,
  documentos,
  setFiles,
  files,
}: {
  tipoDocumento: TipoDocumento;
  documentos?: T[] | null;
  setFiles: React.Dispatch<React.SetStateAction<FileTypeActions<T>>>;
  files: FileTypeActions<T>;
}) {
  const handleUploadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (files.length === 0) throw new Error("El archivo está vacío");
    setFiles((prev) => ({ ...prev, add: files }));
  };
  const handleDeleteFile = (doc: T) => {
    if (!doc.id) return;
    setFiles((prev) => ({
      ...prev,
      remove: prev.remove ? [...prev.remove, doc] : [doc],
    }));
  };
  const filteredDocs =
    documentos?.filter((doc) => doc.tipo_documento === tipoDocumento) || [];
  // Obtener ids de documentos en fila para eliminar
  const docsEnEliminacion = (files?.remove || []).map((d) => d.id);
  return (
    <>
      {filteredDocs.length > 0 && (
        <div className="flex flex-col gap-2 w-full bg-blue-50 dark:bg-gray-700/30 border border-blue-300 dark:border-gray-600 rounded p-4">
          <div className="dark:text-white font-semibold mb-2">
            Documentos cargados:
          </div>
          <ul className="flex flex-col gap-2">
            {filteredDocs.map((doc) => {
              const enEliminacion = docsEnEliminacion.includes(doc.id);
              return (
                <li key={doc.url} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit font-bold text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700/30 dark:text-blue-500 px-2 py-1 rounded inline-block"
                    >
                      <LuFileText className="inline w-5 h-5 mr-2" />
                      {doc.nombre || doc.url}
                    </a>
                    {enEliminacion && (
                      <span className="ml-2 text-xs text-orange-600 bg-orange-100 rounded px-2 py-1">
                        En fila para eliminar
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteFile(doc)}
                    disabled={enEliminacion}
                  >
                    <LuTrash2 className="w-4 h-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div>
        <Label className="mb-1 block" htmlFor="documento">
          Subir documentos
        </Label>
        <FileInput
          id="documento"
          accept=".pdf, .jpg, .jpeg, .png"
          multiple={true}
          onChange={handleUploadFile}
        />
      </div>
    </>
  );
}
