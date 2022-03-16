import { h, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js';

export default {
    setup() {
        console.log(getCurrentInstance());

    },
    render() {
        return h('div', {}, [h('div', {}, 'getCurrentInstance')]);
    }
}