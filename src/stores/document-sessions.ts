import { defineStore, acceptHMRUpdate } from "pinia";
import { PDFDocument, PDFPage } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import {
  useDevicePixelRatio,
  useMemoize,
  type UseMemoizeReturn,
} from "@vueuse/core";
import { zip } from "fflate";

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
  readonly fileId: string;
  readonly pageIndex: number;
}

export const { pixelRatio } = useDevicePixelRatio();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getOrDefault<K, V>(map: Map<K, V>, key: K, defaultValue: () => V): V {
  if (map.has(key)) {
    return map.get(key) as V;
  } else {
    const value = defaultValue();
    map.set(key, value);
    return value;
  }
}

function removeDuplicates<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export const useDocumentSessionStore = defineStore(
  "document-session-store",
  () => {
    // TODO: Use beforeunload with a confirmation dialog if hasUnsavedChanges
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
      hasUnsavedChanges.value = true;
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
                  // TODO: Attempt to render the pages that the user sees first
                  await sleep(0); // Wait a bit to prevent the browser from freezing
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
            pages: pdfDocument
              .getPageIndices()
              .map((pageIndex) => ({ fileId: id, pageIndex: pageIndex })),
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

    function pageToMapKey(page: Page) {
      return JSON.stringify([page.fileId, page.pageIndex]);
    }

    async function createDocumentFrom(
      documents: PageGroup[]
    ): Promise<PDFDocument> {
      /* Notes:
    Using pdfDoc.embedPages does not preserve hyperlinks (neither links to external pages nor internal links).
    Using pdfDoc.embedPdf also does not preserve annotations. (see https://github.com/Hopding/pdf-lib/issues/849 for an official response)
    Using pdfDoc.copyPages preserves annotations, but internal links still break. (see https://github.com/Hopding/pdf-lib/issues/341)
    copyPages also breaks forms (see https://github.com/Hopding/pdf-lib/issues/252)
    */

      const pdfDoc = await PDFDocument.create();

      const pagesPerFile = new Map<string, Page[]>();
      const pages = new Map<string, PDFPage>();
      // Collect pages depending on what file they came from
      documents.forEach((v) => {
        v.pages.forEach((page) => {
          getOrDefault(pagesPerFile, page.fileId, () => []).push(page);
        });
      });

      // Copy page data to the new document
      await Promise.all(
        [...pagesPerFile.entries()].map(async ([fileId, pagesToEmbed]) => {
          const pdf = session.value.files.get(fileId)?.document;
          if (pdf === undefined) return;

          const result = await pdfDoc.copyPages(
            pdf,
            removeDuplicates(pagesToEmbed.map((v) => v.pageIndex))
          );
          result.forEach((embeddedPage, index) => {
            const page = pagesToEmbed[index];
            pages.set(pageToMapKey(page), embeddedPage);
          });
        })
      );

      // Actually insert the pages into the new document
      documents.forEach((v) =>
        v.pages.forEach((page) => {
          pdfDoc.addPage(pages.get(pageToMapKey(page)));
        })
      );
      return pdfDoc;
    }

    async function createZip(files: { name: string; data: Uint8Array }[]) {
      // Random note: Apparently https://github.com/sindresorhus/promise-fun can be used for various "better" promises

      return new Promise<Uint8Array>((resolve, reject) => {
        // TODO: Maybe set some additional options, like the compression level
        zip(
          Object.fromEntries(files.map((v) => [v.name, v.data])),
          {},
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              resolve(data);
            }
          }
        );
      });
    }

    async function download() {
      if (session.value.groups.length === 0) {
        return;
      } else if (session.value.groups.length === 1) {
        const documentBytes = await createDocumentFrom(
          session.value.groups
        ).then((v) => v.save());
        downloadBytes(documentName.value + ".pdf", documentBytes);
      } else {
        const documentBytes = await Promise.all(
          session.value.groups.map((group) =>
            createDocumentFrom([group])
              .then((v) => v.save())
              .then((v) => ({ name: group.name + ".pdf", data: v }))
          )
        );
        // TODO: I might want to use https://github.com/sindresorhus/multi-download to download multiple files at once (on browsers where this works)
        const zipBytes = await createZip(documentBytes);
        downloadBytes(documentName.value + ".zip", zipBytes);
      }
    }

    function downloadBytes(fileName: string, bytes: Uint8Array) {
      const linkElement = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "a"
      );
      linkElement.setAttribute("download", fileName);
      linkElement.setAttribute("rel", "noopener");

      const blobUrl = URL.createObjectURL(new Blob([bytes]));
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 40 * 1000);
      linkElement.setAttribute("href", blobUrl);
      linkElement.click();
    }

    return {
      addFiles,
      documentName,
      session,
      hasUnsavedChanges,
      getRenderedPage,
      download,
    };
  }
);

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useDocumentSessionStore, import.meta.hot)
  );
}
