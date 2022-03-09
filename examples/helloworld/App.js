import { h } from '../../lib/guide-mini-vue.esm.js';

export const App = {
    render() {
        return h('div', 'hi' + msg);
    },
    setup() {
        return {
            msg: 'mini-vue',
        };
    }
};