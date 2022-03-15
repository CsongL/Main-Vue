import { h } from '../../lib/guide-mini-vue.esm.js';
import Child from './Child.js';


export default {
    setup(){},
    render() {
        return h('div', {}, [
            h('div', {}, 'App'),
            h(Child, {}, {
                default: ({age}) => [
                    h('p', {}, '通过slot渲染的第一个元素'),
                    h('p', {}, '通过slot渲染的第二个元素'),
                    h('p', {}, 'age:' + age)
                ]
            })
        ])
    }
}