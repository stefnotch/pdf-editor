<template>
  <div class="container" ref="dropZoneRef">
    <TheNavBar></TheNavBar>
    <PdfEditor></PdfEditor>

    <!--Overlay elements should be the final elements-->
    <TheFileUploadOverlay class="dropzone" v-if="isOverDropZone"></TheFileUploadOverlay>
  </div>
</template>

<script lang="ts" setup>
import PdfEditor from "./components/PdfEditor.vue";
import TheFileUploadOverlay from "./components/TheFileUploadOverlay.vue";
import { useDropZone } from "@vueuse/core";
import { useDocumentSessionStore } from "./stores/document-sessions";
import TheNavBar from "./components/TheNavBar.vue";

const documentSessionStore = useDocumentSessionStore();

const dropZoneRef = ref<HTMLDivElement>();

function onDrop(files: File[] | null) {
  console.log(files);
}

const { isOverDropZone } = useDropZone(dropZoneRef, onDrop);
</script>
<style scoped>
.container {
  position: absolute;
  height: 100vh;
  width: 100vw;
}
</style>
