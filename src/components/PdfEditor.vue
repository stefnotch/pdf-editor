<script setup lang="ts">
import { useDocumentSessionStore, type Page } from "@/stores/document-sessions";
import { useElementSize } from "@vueuse/core";
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

const maximumPagesPerRow = computed(() => Math.floor(pagesViewSize.width.value / pageBounds.value.x));

// TODO: Why does this lead to a browser hang if I change it to a computed, and then edit the pageBounds?
const renderedDocuments = ref<RenderedDocument[]>([]);
watch(
  [pageGroups, maximumPagesPerRow],
  ([pageGroups, maximumPagesPerRow]) => {
    renderedDocuments.value = pageGroups.map((group) => {
      const doc: RenderedDocument = {
        name: group.name,
        rows: [],
      };
      for (let i = 0; i < group.pages.length; i += maximumPagesPerRow) {
        const row: RenderedPageRow = {
          pages: group.pages.slice(i, i + maximumPagesPerRow),
        };
        doc.rows.push(row);
      }
      return doc;
    });
  },
  {
    deep: true,
  }
);

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
</script>
<template>
  <div ref="pagesViewElement" class="h-full overflow-y-scroll">
    <div v-for="(document, index) in renderedDocuments" :key="index" class="pdf-document">
      <div :style="{ height: documentHeaderHeight + 'px' }">{{ document.name }}</div>
      <div v-for="(row, index) in document.rows" :key="index" class="pdf-page-row">
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
