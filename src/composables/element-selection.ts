// Shamelessly copied from QuantumSheet
// https://github.com/stefnotch/quantum-sheet/blob/fab7e88d1e40b2e64d9a8dd7785b04eae7695dee/src/model/document/document.ts#L178

import type { MaybeRef } from "@vueuse/shared";
import type { Ref } from "vue";

export function useElementSelection<
  T extends { selected: MaybeRef<boolean> }
>() {
  const selectedElements = shallowReactive<Set<T>>(new Set());

  function watchElement(element: T) {
    const selected = toRef(element, "selected") as Ref<boolean>;
    const stopHandle = watch(
      selected,
      (value: boolean) => {
        if (value) {
          selectedElements.add(element);
        } else {
          selectedElements.delete(element);
        }
      },
      { immediate: true }
    );

    return () => {
      selected.value = false;
      stopHandle();
    };
  }

  function setSelection(...elements: T[]) {
    selectedElements.forEach((e: T) => {
      if (isRef(e.selected)) {
        e.selected.value = false;
      } else {
        e.selected = false;
      }
    });
    elements.forEach((e) => {
      if (isRef(e.selected)) {
        e.selected.value = true;
      } else {
        e.selected = true;
      }
    });
  }

  return {
    selectedElements: shallowReadonly(selectedElements as ReadonlySet<T>),
    setSelection,
    watchElement,
  };
}
