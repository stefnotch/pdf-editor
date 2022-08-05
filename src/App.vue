<template>
  <div class="container" ref="dropZoneRef">
    <h1>Hello world!</h1>
    <PdfEditor></PdfEditor>

    <!--Overlay elements should be the final elements-->
    <TheFileUploadOverlay class="dropzone" v-if="isOverDropZone"></TheFileUploadOverlay>
  </div>
</template>

<script lang="ts" setup>
import PdfEditor from "./components/PdfEditor.vue";
import TheFileUploadOverlay from "./components/TheFileUploadOverlay.vue";
import { useDropZone } from "@vueuse/core";

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
