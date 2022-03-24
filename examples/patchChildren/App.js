import { h, ref } from '../../lib/guide-mini-vue.esm.js';
import ArrayToText from './ArrayToText.js';
import TextToText from './TextToText.js';
import TextToArray from './TextToArray.js';

export default {
    setup() {
    },
    render() {
        return h('div', '', [h('p', {}, 'Main page'),
        // h(ArrayToText)
        // h(TextToText)
        h(TextToArray)                                                                                                                                                                                                                                        
    ]);
    }
}