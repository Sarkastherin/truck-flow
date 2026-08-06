import { Button } from "flowbite-react";
import { MdInsertPhoto } from "react-icons/md";
import { uploadImage } from "~/backend/Cloudinary/cloudinary";
import { useModal } from "~/context/ModalContext";

export type dataToPayload = {
  url: string;
  public_id: string;
  width: number;
  height: number;
};

export default function ImageFileComponent({
  onUpload,
}: {
  onUpload: (data: dataToPayload[]) => void;
}) {
  const { openModal, closeModal } = useModal();

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      openModal("loading", {
        props: {
          title: "Subiendo imágenes",
          message: "Las imágenes se están subiendo a la nube, por favor espera.",
        },
      });

      // Convertimos FileList → Array
      const filesArray = Array.from(files);

      // Subida en paralelo (rápido y eficiente)
      const results = await Promise.all(
        filesArray.map((file) => uploadImage(file)),
      );
      if (results.length > 0) {
        onUpload(results);
      }
      closeModal();
    } catch (error: any) {
      console.error(error);

      closeModal();

      openModal("error", {
        props: {
          title: "Error",
          message: error.message || "Error al subir la imagen",
        },
      });
    } finally {
      // Resetear input (clave para poder volver a subir el mismo archivo)
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        id="file"
        className="hidden"
        multiple
        onChange={handleUploadFile}
        accept="image/jpeg, image/png, image/jpg, image/webp"
      />

      <Button
        size="sm"
        className="rounded-full px-2 py-2 md:px-4 justify-center items-center gap-2"
        color={"yellow"}
        outline
        onClick={() => document.getElementById("file")?.click()}
      >
        <MdInsertPhoto className="size-4" />
        <span className="hidden md:block">Agregar fotos</span>
      </Button>
    </>
  );
}
