import { h } from '../../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {
    render() {
        window.self = this;
        return h('div', 
            {
                id: 'root',
                class: 'red blue',
                onClick: () => {
                    console.log('click');
                }
            }, [
                h('div', {class: 'blue'}, 'Foo component'),
                h(Foo, {count: 1})
            ]);
            // }, 'hi ' + this.msg);
    },
    setup() {
        return {
            msg: 'mini-vue',
        };
    }
};