import { createComponentInstance, setupComponent } from './component'
import { isObject, EMPTY_OBJECT } from '../shared/index'
import { ShapeFlags } from '../shared/shapeFlags'
import { Fragment, Text } from './vNode'
import { createAppApi } from './createApp'
import { effect } from '../reactivity/src/effect'

export function createRender(options) {
    const { 
        createElement: hostCreateElement, 
        patchProps: hostPatchProps, 
        insert: hostInsert, 
    } = options

    function render(vNode, container) {
        // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
        patch(null, vNode, container, null);
    }
    
    // n1表示之前旧的虚拟节点， n2表示现在新的虚拟节点
    function patch(n1 ,n2, container, parentComponent) {
        // 先判虚拟节点的类型 是元素还是 组件
        // 如果虚拟节点的type是一个string类型， 那么该虚拟节点就是一个元素，
        // 如果vNode.type 类型是一个Object，那么这个虚拟节点就是一个组件
        // 如果是元素 则调用 processElement();
        // 如果是组件 则调用 processComponent();
        let { type, shapeFlags} = n2;
        switch(type) {
            case Fragment:
                processFragment(n2, container, parentComponent);
                break;
            case Text:
                processText(n2, container);
                break;
            default:
                if(shapeFlags & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent);
                } else if(shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processFragment(vNode, container, parentComponent) {
        mountChildren(vNode, container, parentComponent);
    }
    
    function processText(vNode, container) {
        let { children } = vNode;
        let textNode = document.createTextNode(children.text);
        container.appendChild(textNode);
    }
    
    function processElement(n1, n2, container, parentComponent) {
        // 在这里要去判断是新建一个元素还是更新一个元素
        if(!n1) {
            console.log('mount');
            mountElement(n2, container, parentComponent);
        }else {
            console.log('update' );
            updateElement(n1, n2, container, parentComponent);
        }

    }
    
    function mountElement(vNode, container, parentComponent) {
        // 走到这里说明vNode表示的是一个元素，因此vNode.type表述的就是该元素的类型
        let el = (vNode.el = hostCreateElement(vNode.type));
    
        let { children, shapeFlags } = vNode;
    
        if(shapeFlags & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children;
        } else if(shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
            // 因为是挂载该元素的子元素，因此该元素就应该是这些子元素的容器
            mountChildren(children, el, parentComponent);
        }
    
        let { props } = vNode;
        for(const key in props) {
            const val = props[key];
            hostPatchProps(el, key, null, val);
        }
    
        hostInsert(el, container);
    }

    function updateElement(n1, n2, container, parentComponent) {
        // 更新元素
        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;

        // el说我们根据vNode的type创建出来的元素
        const el = (n2.el = n1.el);

        updateProps(el, oldProps, newProps);
    }

    function updateProps(el, oldProps, newProps) {
        for(const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if(prevProp !== nextProp) {
                hostPatchProps(el, key, prevProp, nextProp);
            }
        }
        // 若是在newProps没有这个属性，则需要将这个属性删除
        for(const key in oldProps) {
            if(!(key in newProps)) {
                hostPatchProps(el, key, oldProps[key], null);
            }
        }
    }
    
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        })
    }
    
    function processComponent(n1, n2, container, parentComponent) {
        // 判断是要重新创建一个组件，还是更新一个组件
        // 创建一个新的组件
        if(!n1) {
            mountComponent(n2, container, parentComponent);
        } else {
            updateComponent(n1, n2, container, parentComponent);
        }
    }
    
    function mountComponent(vNode, container, parentComponent) {
        // 第一步创建一个组件实例对象
        const instance = createComponentInstance(vNode, parentComponent);
    
        // 第二部设置组件实例对象的属性
        setupComponent(instance);
        setupRenderEffect(instance, vNode, container);
    }
    
    function setupRenderEffect(instance, vNode, container) {
        effect(() => {
            if(!instance.isMounted) {
                let { proxy } = instance;
                if(!instance.render) return;

                const subTree = instance.render.call(proxy);
                instance.subTree = subTree;

                if(subTree) {
                    patch(null, subTree, container, instance);
                }
                vNode.el = subTree.el;
                instance.isMounted = true;
            } else {
                let { proxy } = instance;
                if(!instance.render) return;

                const subTree = instance.render.call(proxy);
                const previewTree = instance.subTree;
                console.log('previewTree', previewTree);
                console.log('currentTree', subTree);

                instance.subTree = subTree;
                
                if(subTree) {
                    patch(previewTree, subTree, container, instance);
                }
                vNode.el = subTree.el;
            }
        })
        
    }
    // 更新组件
    function updateComponent(n1, n2, container, parentComponent) {

    }

    // 最终返回的是一个对象，这个对象里面有一个createApp属性
    // 这个属性对应的就是createApp.ts文件中 createAppApi方法返回的那个函数
    return {
        createApp: createAppApi(render)
    }
}

