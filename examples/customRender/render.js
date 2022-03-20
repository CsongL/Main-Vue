import { createRender } from '../../lib/guide-mini-vue.esm.js'

let render = createRender({
    createElement(type) {
        const rect = new PIXI.Graphics();
        rect.beginFill(0xff000000);
        rect.drawRect(0, 0, 100, 100);
        rect.endFill();

        return rect;
    },
    patchProps(el, key, val) {
        el[key] = val;
    },
    insert(el, parent) {
        parent.addChild(el);
    }
});

export function createApp(rootComponent) {
    return render.createApp(rootComponent);
}