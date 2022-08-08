import { defineStore, acceptHMRUpdate } from "pinia";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";

/**
 * The data store for a given document.
 * Notice how it's a mostly non-destructive format. It doesn't apply the changes, instead it stores what the final document should look like.
 * This format makes undo and redo much easier to implement.
 */
export interface PdfDocumentSession {
  readonly id: string;

  /**
   * The selected physical PDF files
   */
  files: Map<
    string,
    {
      file: File;
      document: PDFDocument;
    }
  >;

  /**
   * The pdf.js documents
   */
  rendered: Map<string, pdfjs.PDFDocumentProxy>;

  /**
   * Page-groups
   */
  groups: PageGroup[];
}

export interface PageGroup {
  name: string;
  pages: Page[];
}

export interface Page {
  fileId: string;
  pageIndex: number;
}

export const useDocumentSessionStore = defineStore("document-session-store", () => {
  const hasUnsavedChanges = ref(false);
  const session = ref<PdfDocumentSession>({
    id: crypto.randomUUID(),
    files: new Map(),
    rendered: new Map(),
    groups: [],
  });

  const documentName = computed(() => {
    const groups = session.value.groups;
    if (groups.length === 0) {
      return "Untitled Document";
    } else {
      return groups[0].name;
    }
  });

  async function addFiles(files: File[]) {
    await Promise.all(
      files.map(async (file) => {
        const id = crypto.randomUUID();
        const binaryData = new Uint8Array(await file.arrayBuffer());
        const pdfDocument = await PDFDocument.load(binaryData);
        session.value.files.set(id, {
          file,
          document: markRaw(pdfDocument),
        });

        // Instantly start loading the pdf.js document, since we'll need it
        pdfjs.getDocument({ data: binaryData }).promise.then((rendered) => session.value.rendered.set(id, markRaw(rendered)));

        session.value.groups.push({
          name: withoutPdfExtension(file.name),
          pages: pdfDocument.getPageIndices().map((pageIndex) => {
            return { fileId: id, pageIndex: pageIndex };
          }),
        });
      })
    );
  }

  function withoutPdfExtension(fileName: string) {
    return fileName.replace(/\.pdf$/i, "");
  }

  return {
    addFiles,
    documentName,
    session,
    hasUnsavedChanges,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDocumentSessionStore, import.meta.hot));
}
