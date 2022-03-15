import { h, createTextNode } from '../../lib/guide-mini-vue.esm.js'

export default {
    setup() {},
    render() {
        return h('div', {}, [
            h('div', {}, 'App'),
            createTextVNode('这是TextNode创建出来')
        ]);
    }
};