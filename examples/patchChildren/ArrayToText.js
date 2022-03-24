import { h, ref } from '../../lib/guide-mini-vue.esm.js';

export default {
    setup() {
        const isChange = ref(true);
        window.isChange = isChange;

        return {
            isChange
        }
    },
    render() {

        return this.isChange === true
        ? h('div', {} , [h('p', {}, 'A'), h('p', {}, 'B')])
        : h('p', {}, 'newNode')
    }
}