import { ShapeFlags } from "../shared/shapeFlags";

export function initSlots(instance, children) {

    let { vNode } = instance;
    if(vNode.shapeFlags & ShapeFlags.SLOTS_CHILDREN){
        normalizeObjectSlots(children, (instance.slots = {}));
    }


}

function normalizeObjectSlots(rawSlots, slots) {
    for(const key in rawSlots) {
        let value = rawSlots[key];
        if(typeof value === 'function') {
            slots[key] = (prop) => normalizeSlots(value(prop));
        }
    }
}

function normalizeSlots(value) {
    return Array.isArray(value) ? value : [value];
}