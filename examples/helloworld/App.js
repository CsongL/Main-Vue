import { h } from '../../lib/guide-mini-vue.esm.js';

window.self = null;
export const App = {
    render() {
        window.self = this;
        return h('div', 
            {
                id: 'root',
                class: 'red blue' 
            }, 'hi ' + this.msg);
    },
    setup() {
        return {
            msg: 'mini-vue',
        };
    }
};