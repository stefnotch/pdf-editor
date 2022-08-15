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

import type { MaybeComputedRef } from "@vueuse/shared";
import { isClient, resolveUnref, toRefs } from "@vueuse/shared";
import {
  defaultWindow,
  useEventListener,
  type PointerType,
  type Position,
} from "@vueuse/core";
import type { Ref } from "vue";

export interface UseDraggableOptions {
  /**
   * Only start the dragging when click on the element directly
   *
   * @default false
   */
  exact?: MaybeComputedRef<boolean>;

  /**
   * Prevent events defaults
   *
   * @default false
   */
  preventDefault?: MaybeComputedRef<boolean>;

  /**
   * Prevent events propagation
   *
   * @default false
   */
  stopPropagation?: MaybeComputedRef<boolean>;

  /**
   * Element to attach `pointermove` and `pointerup` events to.
   *
   * @default window
   */
  draggingElement?: MaybeComputedRef<
    HTMLElement | SVGElement | Window | Document | null | undefined
  >;

  /**
   * Pointer types that listen to.
   *
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: PointerType[];

  /**
   * Initial position of the element.
   *
   * @default { x: 0, y: 0}
   */
  initialValue?: MaybeComputedRef<Position>;

  /**
   * Callback when the dragging starts. Return `false` to prevent dragging.
   */
  onStart?: (position: Position, event: PointerEvent) => void | false;

  /**
   * Callback during dragging.
   */
  onMove?: (position: Position, event: PointerEvent) => void;

  /**
   * Callback when dragging end.
   */
  onEnd?: (position: Position, event: PointerEvent) => void;
}

// Fix https://github.com/vueuse/vueuse/issues/2053

/**
 * Make elements draggable.
 *
 * @see https://vueuse.org/useDraggable
 * @param target
 * @param options
 */
export function useDraggable(
  target: Ref<HTMLElement | SVGElement | null | undefined>,
  options: UseDraggableOptions = {}
) {
  const draggingElement = options.draggingElement ?? defaultWindow;
  const position = ref<Position>(
    resolveUnref(options.initialValue) ?? { x: 0, y: 0 }
  );
  const pressedDelta = ref<Position>();

  const filterEvent = (e: PointerEvent) => {
    if (options.pointerTypes)
      return options.pointerTypes.includes(e.pointerType as PointerType);
    return true;
  };

  const handleEvent = (e: PointerEvent) => {
    if (resolveUnref(options.preventDefault)) e.preventDefault();
    if (resolveUnref(options.stopPropagation)) e.stopPropagation();
  };

  const start = (e: PointerEvent) => {
    if (!filterEvent(e)) return;
    if (resolveUnref(options.exact) && e.target !== resolveUnref(target))
      return;
    const rect = resolveUnref(target)!.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    if (options.onStart?.(pos, e) === false) return;
    pressedDelta.value = pos;
    handleEvent(e);
  };
  const move = (e: PointerEvent) => {
    if (!filterEvent(e)) return;
    if (!pressedDelta.value) return;
    position.value = {
      x: e.clientX - pressedDelta.value.x,
      y: e.clientY - pressedDelta.value.y,
    };
    options.onMove?.(position.value, e);
    handleEvent(e);
  };
  const end = (e: PointerEvent) => {
    if (!filterEvent(e)) return;
    if (!pressedDelta.value) return;
    pressedDelta.value = undefined;
    options.onEnd?.(position.value, e);
    handleEvent(e);
  };

  if (isClient) {
    useEventListener(target, "pointerdown", start, true);
    useEventListener(draggingElement, "pointermove", move, true);
    useEventListener(draggingElement, "pointerup", end, true);
  }

  return {
    ...toRefs(position),
    position,
    isDragging: computed(() => !!pressedDelta.value),
    style: computed(
      () => `left:${position.value.x}px;top:${position.value.y}px;`
    ),
  };
}

export type UseDraggableReturn = ReturnType<typeof useDraggable>;
