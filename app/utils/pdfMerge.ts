import { PDFDocument } from "pdf-lib";
import { downloadFileFromDrive } from "~/backend/Database/apiDrive";
import type { Documentos } from "~/types/pedido";

const A4_WIDTH = 612;
const A4_HEIGHT = 792;

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

async function embedImageAsPage(
  mergedPdf: PDFDocument,
  imageBytes: ArrayBuffer,
  mimeType: string,
): Promise<void> {
  let image;
  if (mimeType === "image/png") {
    image = await mergedPdf.embedPng(imageBytes);
  } else {
    image = await mergedPdf.embedJpg(imageBytes);
  }

  const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  const { width, height } = image.scale(1);

  const scale = Math.min((A4_WIDTH - 40) / width, (A4_HEIGHT - 40) / height);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  page.drawImage(image, {
    x: (A4_WIDTH - scaledWidth) / 2,
    y: (A4_HEIGHT - scaledHeight) / 2,
    width: scaledWidth,
    height: scaledHeight,
  });
}

async function addSeparatorPage(
  mergedPdf: PDFDocument,
  title: string,
): Promise<void> {
  const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  const font = await mergedPdf.embedFont("Helvetica-Bold");

  page.drawText(title, {
    x: A4_WIDTH / 2 - font.widthOfTextAtSize(title, 24) / 2,
    y: A4_HEIGHT / 2,
    size: 24,
    font,
  });
}

export async function mergePDFs(
  mainPdfBlob: Blob,
  documents: Documentos[],
  onProgress?: (current: number, total: number, fileName: string) => void,
): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  const mainPdfBytes = await mainPdfBlob.arrayBuffer();
  const mainPdf = await PDFDocument.load(mainPdfBytes);
  const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
  mainPages.forEach((page) => mergedPdf.addPage(page));

  console.log(`[pdfMerge] Documentos a procesar: ${documents.length}`);

  if (documents.length === 0) {
    return new Blob([await mergedPdf.save()], { type: "application/pdf" });
  }

  const failedDocs: string[] = [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.log(`[pdfMerge] Procesando ${i + 1}/${documents.length}: ${doc.nombre} (${doc.tipo_documento})`);
    onProgress?.(i + 1, documents.length, doc.nombre);

    try {
      const result = await downloadFileFromDrive(doc.url);

      if ("error" in result) {
        console.warn(`[pdfMerge] Error descargando ${doc.nombre}: ${result.error}`);
        failedDocs.push(doc.nombre);
        continue;
      }

      console.log(`[pdfMerge] Descargado ${doc.nombre}: mimeType=${result.mimeType}, size=${result.data.byteLength}`);

      if (isPdfFile(result.mimeType)) {
        const extPdf = await PDFDocument.load(result.data);
        const extPages = await mergedPdf.copyPages(extPdf, extPdf.getPageIndices());
        extPages.forEach((page) => mergedPdf.addPage(page));
        console.log(`[pdfMerge] PDF ${doc.nombre} agregado: ${extPages.length} páginas`);
      } else if (isImageFile(result.mimeType)) {
        await embedImageAsPage(mergedPdf, result.data, result.mimeType);
        console.log(`[pdfMerge] Imagen ${doc.nombre} agregada como página`);
      } else {
        console.warn(`[pdfMerge] Tipo no soportado: ${result.mimeType} (${doc.nombre})`);
        failedDocs.push(doc.nombre);
      }
    } catch (error) {
      console.warn(`[pdfMerge] Error procesando ${doc.nombre}:`, error);
      failedDocs.push(doc.nombre);
    }
  }

  if (failedDocs.length > 0) {
    console.warn("[pdfMerge] Documentos que fallaron:", failedDocs);
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
