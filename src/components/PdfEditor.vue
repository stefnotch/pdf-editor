<script setup lang="ts">
import { useDocumentSessionStore, type Page } from "@/stores/document-sessions";
import { useElementSize } from "@vueuse/core";
import type { UploadFileInfo } from "naive-ui";
import PdfPage from "./PdfPage.vue";

const documentSessionStore = useDocumentSessionStore();
const pageGroups = computed(() => documentSessionStore.session.groups);

const pagesViewElement = ref<HTMLElement | null>(null);
const pagesViewSize = useElementSize(pagesViewElement);

interface Vector2 {
  x: number;
  y: number;
}

const pageBounds = ref<Vector2>({
  x: 120,
  y: 120,
});

interface RenderedDocument {
  name: string;
  rows: RenderedPageRow[];
}

interface RenderedPageRow {
  pages: Page[];
}

const maximumPagesPerRow = computed(
  () => Math.max(1, Math.floor(pagesViewSize.width.value / pageBounds.value.x)) // Without the minimum, this can be zero, which is terrible
);

const renderedDocuments = computed(() => {
  const pagesPerRow = maximumPagesPerRow.value;
  return pageGroups.value.map((group) => {
    const doc: RenderedDocument = {
      name: group.name,
      rows: [],
    };
    for (let i = 0; i < group.pages.length; i += pagesPerRow) {
      const row: RenderedPageRow = {
        pages: group.pages.slice(i, i + pagesPerRow),
      };
      doc.rows.push(row);
    }
    return doc;
  });
});

const documentHeaderHeight = ref(20);

/**
 * # Virtual List VS Resize Observer
 * Virtual List:
 * - https://vueuse.org/core/useVirtualList/
 * - Scales rather nicely to the case where the screen is rather small and the PDF has a ton of pages.
 * - We always see all pages in one row, so a virtual list would do the job rather well.
 * - https://github.com/vueuse/vueuse/issues/2065
 *
 * Intersection Observer:
 * - We need to write it ourselves, since the Vueuse library only supports having one observer per element. (Inefficient)
 */

// TODO: When resizing/zooming, make sure that the *same* pages remain visible.

function fileUploaded(data: { fileList: UploadFileInfo[] }) {
  documentSessionStore.addFiles(
    data.fileList.flatMap((f) => (f.file ? [f.file] : []))
  );
}
</script>
<template>
  <div v-if="pageGroups.length === 0">
    <h1>PDF Editor</h1>
    <span>No PDFs selected</span>

    <n-upload
      :default-upload="false"
      accept="application/pdf"
      :file-list="[]"
      multiple
      directory-dnd
      @change="fileUploaded"
    >
      <n-upload-dragger>
        <n-text style="font-size: 16px">
          Click or drag a PDF to this area
        </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          All PDFs are private and will only be stored on your local machine.
        </n-p>
      </n-upload-dragger>
    </n-upload>
  </div>
  <div
    v-else
    ref="pagesViewElement"
    class="absolute h-full w-full overflow-y-scroll overflow-x-hidden"
  >
    <div
      v-for="(document, index) in renderedDocuments"
      :key="index"
      class="pdf-document"
    >
      <div :style="{ height: documentHeaderHeight + 'px' }">
        {{ document.name }}
      </div>
      <div
        v-for="(row, index) in document.rows"
        :key="index"
        class="pdf-page-row"
      >
        <div v-for="(page, index) in row.pages" :key="index" class="pdf-page">
          <PdfPage :page="page" :bounds="pageBounds"></PdfPage>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.pdf-page-row {
  display: flex;
  flex-direction: row;
  height: calc(v-bind("pageBounds.y") * 1px);
}
.pdf-page {
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: calc(v-bind("pageBounds.x") * 1px);
  width: calc(v-bind("pageBounds.x") * 1px);
  height: calc(v-bind("pageBounds.y") * 1px);
}
</style>
