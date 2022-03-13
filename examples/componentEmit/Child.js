import { h } from '../../lib/guide-mini-vue.esm.js';
export default {
    setup(props, { emit }) {
        const emitted = () => {
            emit('add', 1, 2);
            emit('add-foo', 3, 4);
        };
        return  {
            emitted
        };
    },
    render() {
        const btn = h('button', {
            onClick: () => {
                this.emitted();
            }
        }, 'Click button');
        const p = h('p', {}, 'Child Component');
        return h('div', {}, [p, btn]);
    }
}