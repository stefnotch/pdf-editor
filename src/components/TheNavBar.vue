<script setup lang="ts">
import { useDocumentSessionStore } from "@/stores/document-sessions";
const documentSessionStore = useDocumentSessionStore();

function download() {
  documentSessionStore.download();
}
</script>

<template>
  <div class="nav-bar">
    <h1>PDF Editor</h1>
    <n-button type="primary" @click="download">
      Download
      <!--TODO: Put document name here, and give the button a max-width/a fixed width-->
      <!--TODO: Put "merged"/"individual" dropdown next to button-->
    </n-button>
  </div>
</template>
<style scoped>
.nav-bar {
  border-bottom: 1px solid black;
}
</style>
