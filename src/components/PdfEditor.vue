<template>
  <div>hmm</div>
</template>
<script setup lang="ts">
import { useDocumentSessionStore } from '@/stores/document-sessions.js';

const props = defineProps<{
  id: string;
}>();

interface PdfDocument {
  name: string;
}
const documentSessionStore = useDocumentSessionStore();

const document = ref<PdfDocument | null>(null);
watchEffect(() => {
  const loadedDocument = documentSessionStore.(props.id);
});
</script>
