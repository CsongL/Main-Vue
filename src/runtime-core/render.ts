import { createComponentInstance, setupComponent } from './component'
import { isObject } from '../shared/index'
import { ShapeFlags } from '../shared/shapeFlags'
import { Fragment, Text } from './vNode'


export function render(vNode, container) {
    // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
    patch(vNode, container);
}

function patch(vNode, container) {
    // 先判虚拟节点的类型 是元素还是 组件
    // 如果虚拟节点的type是一个string类型， 那么该虚拟节点就是一个元素，
    // 如果vNode.type 类型是一个Object，那么这个虚拟节点就是一个组件
    // 如果是元素 则调用 processElement();
    // 如果是组件 则调用 processComponent();
    let { type, shapeFlags} = vNode;
    switch(type) {
        case Fragment:
            processFragment(vNode, container);
            break;
        case Text:
            processText(vNode, container);
            break;
        default:
            if(shapeFlags & ShapeFlags.ELEMENT) {
                processElement(vNode, container);
            } else if(shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(vNode, container);
            }
    }
}
function processFragment(vNode, container) {
    mountChildren(vNode, container);
}

function processText(vNode, container) {
    let { children } = vNode;
    let textNode = document.createTextNode(children.text);
    container.appendChild(textNode);
}

function processElement(vNode, container) {
    // 在这里要去判断是新建一个元素还是更新一个元素
    mountElement(vNode, container);
}

function mountElement(vNode, container) {
    // 走到这里说明vNode表示的是一个元素，因此vNode.type表述的就是该元素的类型
    let el = (vNode.el = document.createElement(vNode.type));

    let { children, shapeFlags } = vNode;

    if(shapeFlags & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    } else if(shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // 因为是挂载该元素的子元素，因此该元素就应该是这些子元素的容器
        mountChildren(children, el);
    }

    let { props } = vNode;
    for(const key in props) {
        const val = props[key];
        // 判断属性是一个要添加在元素上的事件还是只是单纯的元素属性
        let isOnEvent = /^on[A-Z]/.test(key);
        if(isOnEvent) {
            let eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, val);
        } else {
            el.setAttribute(key, props[key]);
        }
    }

    container.appendChild(el);
}

function mountChildren(children, container) {
    children.forEach((v) => {
        patch(v, container);
    })
}

function processComponent(vNode, container) {
    // 判断是要重新创建一个组件，还是更新一个组件
    // 创建一个新的组件
    mountComponent(vNode, container);
}

function mountComponent(vNode, container) {
    // 第一步创建一个组件实例对象
    const instance = createComponentInstance(vNode);

    // 第二部设置组件实例对象的属性
    setupComponent(instance);
    setupRenderEffect(instance, vNode, container);
}

function setupRenderEffect(instance, vNode, container) {
    let { proxy } = instance;
    const subTree = instance.render.call(proxy);

    if(subTree) {
        patch(subTree, container);
    }
    vNode.el = subTree.el;
}