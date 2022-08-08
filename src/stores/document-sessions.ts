import { defineStore, acceptHMRUpdate } from "pinia";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import { useMemoize, type UseMemoizeReturn } from "@vueuse/core";

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
  rendered: Map<
    string,
    {
      document: pdfjs.PDFDocumentProxy;
      cache: UseMemoizeReturn<Promise<pdfjs.PDFPageProxy>, [number]>;
      pages: Map<number, pdfjs.PDFPageProxy>;
    }
  >;

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
        pdfjs.getDocument({ data: binaryData }).promise.then((rendered) => {
          const pages = reactive(new Map());

          session.value.rendered.set(id, {
            document: markRaw(rendered),
            // Basically we don't want to needlessly load pages multiple times. And we don't like promises, we want beautiful reactive data.
            cache: useMemoize(
              async (pageIndex: number) => {
                const renderedPage = await rendered.getPage(pageIndex + 1);
                pages.set(pageIndex, markRaw(renderedPage));
                return renderedPage;
              },
              {
                getKey: (v) => v as any, // https://github.com/vueuse/vueuse/issues/2062
              }
            ),
            // Reactive pages
            pages: pages,
          });
        });

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

  function getRenderedPage(page: Page): pdfjs.PDFPageProxy | null {
    const rendered = session.value.rendered.get(page.fileId);
    if (rendered === undefined) return null;

    const cachedPage = rendered.pages.get(page.pageIndex);
    if (cachedPage !== undefined) return cachedPage;

    // Start loading it
    rendered.cache(page.pageIndex);
    return null;
  }

  return {
    addFiles,
    documentName,
    session,
    hasUnsavedChanges,
    getRenderedPage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDocumentSessionStore, import.meta.hot));
}
