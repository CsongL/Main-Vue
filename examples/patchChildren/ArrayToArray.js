import { h, ref } from '../../lib/guide-mini-vue.esm.js';

// 左侧比较
// const prevArray = [ 
//     h('div', {key: 'A'}, 'A'),
//     h('div', {key: 'B'}, 'B')
// ]

// const currArray = [ 
//     h('div', {key: 'A'}, 'A'),
//     h('div', {key: 'B'}, 'B'),
//     h('div', {key: 'C'}, 'C')
// ]

// 右侧比较
// const prevArray = [ 
//     h('div', {key: 'A'}, 'A'),
//     h('div', {key: 'B'}, 'B')
// ]

// const currArray = [ 
//     h('div', {key: 'C'}, 'C'),
//     h('div', {key: 'A'}, 'A'),
//     h('div', {key: 'B'}, 'B')
// ]

//中间新的比老的多
// const prevArray = [ 
//     h('div', {key: 'A'}, 'A'),
//     h('div', {key: 'B'}, 'B'),
//     h('div', {key: 'E'}, 'E'),
// ]

// const currArray = [ 
//     h('div', {key: 'A'}, 'A'),
//     h('div', {key: 'B'}, 'B'),
//     h('div', {key: 'C'}, 'C'),
//     h('div', {key: 'D'}, 'D'),
//     h('div', {key: 'E'}, 'E'),
// ]

// 老的比新的多
const prevArray = [ 
    h('div', {key: 'A'}, 'A'),
    h('div', {key: 'B'}, 'B'),
    h('div', {key: 'C'}, 'C'),
    h('div', {key: 'D'}, 'D'),
    h('div', {key: 'E'}, 'E'),
]

const currArray = [ 
    h('div', {key: 'A'}, 'A'),
    h('div', {key: 'B'}, 'B'),
    h('div', {key: 'E'}, 'E'),
]

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
        ? h('div', {} , prevArray)
        : h('div', {}, currArray);
    }
}