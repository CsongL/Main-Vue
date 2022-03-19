import { h, provide, inject} from '../../lib/guide-mini-vue.esm.js';

const Provider = {
    setup() {
        provide('foo', 'foo');
        provide('bar', 'bar');
    },
    render() {
        return h('div', {}, [h('p', {}, 'Provide'), h(ProviderTwo)]);
    }
};

const ProviderTwo = {
    setup() {
        provide('zoo', 'zoo');
        provide('foo', 'Two foo');
        let foo = inject('foo');
        return {
            foo,
        }
    },
    render() {
        return h('div', {}, [h('p', {}, `ProvideTwo-${this.foo}`), h(Consumer)]);
    }
}

const Consumer = {
    setup() {
        const foo = inject('foo');
        const bar = inject('bar');
        const zoo = inject('zoo');
        const f = inject('f', () => 'f');
        return {
            foo,
            bar,
            zoo,
            f
        };
    },
    render() {
        return h('p', {}, `Consumer: ${this.foo} - ${this.bar}-${this.zoo}-${this.f}`);
    }
};

export default {
    setup() {

    },
    render() {
        return h('div', {} , [h('p', {}, 'App'), h(Provider)]);
    }
};