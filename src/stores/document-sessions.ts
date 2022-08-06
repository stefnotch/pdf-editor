import { defineStore, acceptHMRUpdate } from "pinia";
import { get, set } from "idb-keyval";

// Taken very much from https://github.com/stefnotch/starboard-editor/blob/main/src/useNotebookStorage.ts

/**
 * The data store for a given document.
 */
interface PdfDocumentSession {
  readonly id: string;
  /**
   * ISO timestamp
   */
  lastUpdatedAt: number;
  /**
   * The selected files
   */
  files: Map<string, File>;
  /**
   * Page-groups
   */
  groups: PageGroup[];
}

interface PageGroup {
  name: string;
  pages: Page[];
}

interface Page {
  fileId: string;
  pageNumber: number;
}

const sessions = shallowReactive<Map<string, PdfDocumentSession>>(new Map<string, PdfDocumentSession>());
const isLoaded = ref(false);

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
  const hasUnsavedChanges = ref(false);

  async function createSession(files: File[]) {
    const session = {
      id: crypto.randomUUID(),
      name: files.at(0)?.name ?? "Untitled.pdf",
      files: [],
    };
    await initPromise;
    sessions.set(session.id, session);
    await set("pdf-sessions", toRaw(sessions));
    return session.id;
  }

  async function getSession(sessionId: string) {
    await initPromise;
    return sessions.get(sessionId) ?? null;
  }

  return {
    getSession,
    createSession,
    isLoaded: computed(() => isLoaded.value),
    hasUnsavedChanges,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDocumentSessionStore, import.meta.hot));
}
