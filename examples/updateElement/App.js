import { h } from '../../lib/guide-mini-vue.esm.js';
import { ref } from '../../lib/guide-mini-vue.esm.js'
export default {
    setup() {
        const count = ref(0);
        const onClick = function() {
            count.value++;
        };
        return {
            count,
            onClick
        };
    },
    render() {
        return h('div', {}, [
            h('p', {}, `Count: ${this.count}`),
            h('button', {onClick: this.onClick}, 'click')
        ]);
    }
}