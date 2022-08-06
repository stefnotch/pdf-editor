<template>
  <div>PDF Document Name {{ documentSessionStore.documentName }}</div>
</template>
<script setup lang="ts">
import { useDocumentSessionStore } from "@/stores/document-sessions.js";

const documentSessionStore = useDocumentSessionStore();
</script>
