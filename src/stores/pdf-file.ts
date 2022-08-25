// Deals with physical PDFs that are saved on the hard drive
import { PDFDocument } from "pdf-lib";
import mapUtils from "@/map-utils";

export type GeneratedId = string;

// Sharing the private constructor inside this module, so that the other classes can use it
let createPageRef: (fileId: string, pageIndex: number) => PageRef;

export class PageRef {
  readonly fileId: string;
  readonly pageIndex: number;

  static {
    createPageRef = (fileId: string, pageIndex: number) => {
      return new PageRef(fileId, pageIndex);
    };
  }

  private constructor(fileId: string, pageIndex: number) {
    this.fileId = fileId;
    this.pageIndex = pageIndex;
  }
}

export class PhysicalPdfFile {
  readonly id: GeneratedId;
  readonly file: Readonly<File>;
  readonly document: PDFDocument;
  readonly pageRefs = new Map<number, PageRef>();

  private constructor(id: string, file: File, document: PDFDocument) {
    this.id = id;
    this.file = file;
    this.document = document;
  }

  static async from(id: string, file: File) {
    const binaryData = new Uint8Array(await file.arrayBuffer());
    const pdfDocument = await PDFDocument.load(binaryData);
    return new PhysicalPdfFile(id, file, pdfDocument);
  }

  getPage(pageIndex: number) {
    if (0 <= pageIndex && pageIndex < this.document.getPageCount()) {
      return mapUtils.getOrDefault(this.pageRefs, pageIndex, () =>
        createPageRef(this.id, pageIndex)
      );
    } else {
      throw new Error(`Page index out of bounds: ${pageIndex}`);
    }
  }
}
