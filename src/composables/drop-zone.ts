/*
@license
MIT License

Copyright (c) 2019-PRESENT Anthony Fu<https://github.com/antfu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { useEventListener } from "@vueuse/core";
import { isClient } from "@vueuse/shared";
import type { Ref } from "vue";

export interface UseDropZoneReturn {
  isOverDropZone: Ref<boolean>;
}

// Fixed https://github.com/vueuse/vueuse/issues/2057
// isOverDropZone will now only be true if there are actually files

function hasFiles(dataTransfer: DataTransfer): boolean {
  return [...dataTransfer.items].some((item) => item.kind === "file");
}

export function useDropZone(
  target: Ref<HTMLElement | null>,
  onDrop?: (files: File[] | null) => void
): UseDropZoneReturn {
  const isOverDropZone = ref(false);
  let counter = 0;

  if (isClient) {
    useEventListener<DragEvent>(target, "dragenter", (event) => {
      event.preventDefault();
      counter += 1;
      isOverDropZone.value = event.dataTransfer
        ? hasFiles(event.dataTransfer)
        : false;
    });
    useEventListener<DragEvent>(target, "dragover", (event) => {
      if (isOverDropZone.value && event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      event.preventDefault();
    });
    useEventListener<DragEvent>(target, "dragleave", (event) => {
      event.preventDefault();
      counter -= 1;
      if (counter === 0) isOverDropZone.value = false;
    });
    useEventListener<DragEvent>(target, "drop", (event) => {
      event.preventDefault();
      counter = 0;
      isOverDropZone.value = false;
      const files = Array.from(event.dataTransfer?.files ?? []);
      onDrop?.(files.length === 0 ? null : files);
    });
  }

  return {
    isOverDropZone,
  };
}
