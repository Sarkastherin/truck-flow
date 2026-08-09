import imageCompression from "browser-image-compression";

const cloudName = import.meta.env.VITE_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET;
const apiKey = import.meta.env.VITE_API_KEY_CLOUD;
const apiSecret = import.meta.env.VITE_API_SECRET_CLOUD;

const uploadImage = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  // Comprimir
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
  });

  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Error subiendo imagen");
  }

  const data = await res.json();

  return {
    url: data.secure_url as string,
    public_id: data.public_id as string,
    width: data.width as number,
    height: data.height as number,
  };
};

const deleteImage = async (publicId: string): Promise<void> => {
  if (!publicId) {
    throw new Error("El public_id de la imagen es requerido");
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_id: publicId,
        api_key: apiKey,
        timestamp,
        signature,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || "Error eliminando imagen de Cloudinary"
    );
  }
};

export { uploadImage, deleteImage };