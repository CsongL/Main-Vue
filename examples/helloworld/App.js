import { h } from '../../lib/guide-mini-vue.esm.js';

export const App = {
    render() {
        return h('div', 
            {
                id: 'root',
                class: 'red blue' 
            },[
                h(
                    'p',
                    {
                        class: 'red'
                    }, 'hi'
                ),
                h(
                    'p',
                    {
                        class: 'blue'
                    }, 
                    'world'
                )
            ]);
    },
    setup() {
        return {
            msg: 'mini-vue',
        };
    }
};