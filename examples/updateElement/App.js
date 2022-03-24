import { h } from '../../lib/guide-mini-vue.esm.js';
import { ref } from '../../lib/guide-mini-vue.esm.js'
export default {
    setup() {
        const count = ref(0);
        const props = ref({
            foo: 'foo',
            bar: 'bar'
        });
        const onClick = function() {
            count.value++;
        };
        const changeFooVal = function() {
            props.value.foo = 'new-foo';
        };
        const changeFooToUndefined = function() {
            props.value.foo = undefined;
        };

        const changeBarToNull = function() {
            props.value = {foo: 'foo'};
        };
        return {
            count,
            onClick,
            changeFooVal,
            changeFooToUndefined,
            changeBarToNull,
            props,
        };
    },
    render() {
        return h('div', {...this.props}, [
            h('p', {}, `Count: ${this.count}`),
            h('button', {onClick: this.onClick}, 'click'), 
            h('button', {onClick: this.changeFooVal}, 'change Foo value'),
            h('button', {onClick: this.changeFooToUndefined}, 'change Foo to undefined'),
            h('button', {onClick: this.changeBarToNull}, 'change Bar to Null')
        ]);
    }
}