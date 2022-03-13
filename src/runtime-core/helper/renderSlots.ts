import { createVNode  } from "../vNode";

export function renderSlots(slots, name: string, prop) {
    const slot = slots[name];
    if(slot) {
        if(typeof slot === 'function') {
            return createVNode('div', {}, slot(prop));
        }
    }
}