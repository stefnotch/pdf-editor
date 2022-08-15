<script lang="ts" setup>
import PdfEditor from "./components/PdfEditor.vue";
import TheFileUploadOverlay from "./components/TheFileUploadOverlay.vue";
import { useDocumentSessionStore } from "./stores/document-sessions";
import TheNavBar from "./components/TheNavBar.vue";
import { useDropZone } from "./composables/drop-zone";

const documentSessionStore = useDocumentSessionStore();

const dropZoneRef = ref<HTMLElement | null>(null);

// TODO: Loading indicator
// TODO: Complain if the document isn't really a PDF

function onDrop(files: File[] | null) {
  if (files) {
    documentSessionStore.addFiles(files);
  }
}

const { isOverDropZone } = useDropZone(dropZoneRef, onDrop);
</script>

<template>
  <div class="absolute h-full w-full flex flex-col" ref="dropZoneRef">
    <TheNavBar></TheNavBar>
    <!-- Flexbox is terribly badly designed https://stackoverflow.com/questions/36230944/prevent-flex-items-from-overflowing-a-container -->
    <div class="grow relative">
      <div class="absolute h-full w-full">
        <PdfEditor></PdfEditor>
      </div>
    </div>

    <!--Overlay elements should be the final elements-->
    <TheFileUploadOverlay
      class="dropzone"
      v-if="isOverDropZone"
    ></TheFileUploadOverlay>
  </div>
</template>
