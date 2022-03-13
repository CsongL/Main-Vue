import { h } from '../../lib/guide-mini-vue.esm.js';
import Child from './Child.js';

export default {
    setup() {

    },
    render() {
        return h('div', {}, [
            h('div', {}, 'App Component'),
            h(Child, {
                msg: 'Foo Component',
                onAdd: (a, b) => {
                    console.log('onAdd', a, b);
                },
                onAddFoo: (a, b) => {
                    console.log('onAddFoo', a, b);
                }
            }, '')
        ]);
    }
}