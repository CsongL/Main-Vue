import { h, ref } from '../../lib/guide-mini-vue.esm.js'
import Child from './Child.js'
export default {
    name: 'app',
    setup() {
        const msg = ref("123");
        window.msg = msg;

        const changeChildProps = () => {
            msg.value = '456';
        };

        return {
            msg,
            changeChildProps
        };
    },
    render() {
        return h('div', {}, [
            h("div", {}, '你好'),
            h('button', {onClick: this.changeChildProps}, 'Click to change msg value'),
            h(Child, { msg: this.msg})
        ]);
    }
};