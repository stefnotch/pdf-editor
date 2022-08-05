import { defineStore, acceptHMRUpdate } from "pinia";
import { get, set } from "idb-keyval";

// Taken very much from https://github.com/stefnotch/starboard-editor/blob/main/src/useNotebookStorage.ts

/**
 * The data store for a given document.
 */
interface PdfDocumentSession {
  id: string;
  /**
   * Name also used for the output
   */
  name: string;
  /**
   * The selected files
   */
  files: File[];
}

const sessions = shallowReactive<Map<string, PdfDocumentSession>>(new Map<string, PdfDocumentSession>());
const isLoaded = ref(false);
const hasUnsavedChanges = ref(false);

const initPromise = Promise.allSettled([
  get<Map<string, PdfDocumentSession>>("pdf-sessions").then((v) => {
    if (v) {
      for (const entry of v.entries()) {
        sessions.set(entry[0], entry[1]);
      }
    }
  }),
]).then((v) => {
  isLoaded.value = true;
  return v;
});

export const useDocumentSessionStore = defineStore("document-session-store", () => {
  const selectedSession = ref<PdfDocumentSession | null>(null);

  async function openSession(sessionId: string) {
    await initPromise;
    selectedSession.value = sessions.get(sessionId) ?? null;
  }

  async function createSession(files: File[]) {
    selectedSession.value = {
      id: crypto.randomUUID(),
      name: files.at(0)?.name ?? "Untitled.pdf",
      files: [],
    };
    await initPromise;
    sessions.set(selectedSession.value.id, selectedSession.value);
    await set("pdf-sessions", toRaw(sessions));
  }

  return {
    openSession,
    createSession,
    isLoaded: computed(() => isLoaded.value),
    hasUnsavedChanges: computed(() => hasUnsavedChanges.value),
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDocumentSessionStore, import.meta.hot));
}
