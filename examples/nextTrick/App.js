import { h, ref } from '../../lib/guide-mini-vue.esm.js'

export default {
    name: 'app',
    setup() {
        const count = ref(0);
        const onClick = function() {
            for(let i = 0; i < 100; i++) {
                count.value = i;
            }
        };
        return {
            count,
            onClick
        };
    },
    render() {
        return h('div', {}, [
            h('button', {onClick: this.onClick}, 'update'),
            h('div', {}, `count = ${this.count}` )
        ]);
    }
}