import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js';

export default {
    setup() {},
    render() {
        return h('div', {}, [
            h('div', {}, 'child'),
            renderSlots(this.$slot, 'default', {age: 12})
        ]);
    }
};