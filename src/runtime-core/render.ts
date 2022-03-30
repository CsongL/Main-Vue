import { createComponentInstance, setupComponent } from './component'
import { isObject, EMPTY_OBJECT } from '../shared/index'
import { ShapeFlags } from '../shared/shapeFlags'
import { Fragment, Text } from './vNode'
import { createAppApi } from './createApp'
import { effect } from '../reactivity/src/effect'
import { remove } from '../runtime-dom'
import { shouldUpdateComponent } from './componentRenderUtils'
import { queryJob } from './schedule'

export function createRender(options) {
    const { 
        createElement: hostCreateElement, 
        patchProps: hostPatchProps, 
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText 
    } = options

    function render(vNode, container) {
        // 调用patch进行vNode的拆箱操作，也就是看虚拟节点后是否还有其他节点
        patch(null, vNode, container, null, null);
    }
    
    // n1表示之前旧的虚拟节点， n2表示现在新的虚拟节点
    function patch(
        n1,
        n2, 
        container, 
        anchor, 
        parentComponent) {
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
                    processElement(n1, n2, container, anchor, parentComponent);
                } else if(shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
        }
    }
    function processFragment(vNode, container, parentComponent) {
        mountChildren(vNode.children, container, parentComponent);
    }
    
    function processText(vNode, container) {
        let { children } = vNode;
        let textNode = document.createTextNode(children.text);
        container.appendChild(textNode);
    }
    
    function processElement(n1, n2, container, anchor, parentComponent) {
        // 在这里要去判断是新建一个元素还是更新一个元素
        if(!n1) {
            console.log('mount');
            mountElement(n2, container, anchor, parentComponent);
        }else {
            console.log('update' );
            updateElement(n1, n2, container, parentComponent);
        }

    }
    
    function mountElement(vNode, container, anchor, parentComponent) {
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
    
        hostInsert(el, container, anchor);
    }

    function updateElement(n1, n2, container, parentComponent) {
        // 更新元素
        const oldProps = n1.props || EMPTY_OBJECT;
        const newProps = n2.props || EMPTY_OBJECT;

        // el说我们根据vNode的type创建出来的元素
        const el = (n2.el = n1.el);
        updateChildren(n1, n2, el, parentComponent);
        updateProps(el, oldProps, newProps);
    }


    function updateChildren(n1, n2, container, parentComponent) {
        
        console.log('updateChildren');
        const prevShapeFlag = n1.shapeFlags;
        const currShapeFlag = n2.shapeFlags;

        const c1 = n1.children;
        const c2 = n2.children;

        if(currShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
               unMountChild(c1);
            }
            if(c1 !== c2) {
                hostSetElementText(container, c2)
            }
        } else {
            if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent);
            }
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                patchKeyedChildren(c1, c2, container, parentComponent);
            }
        }

    }

    function patchKeyedChildren(c1, c2, container, parentComponent) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;

        const isSameVNode = (node1, node2) => {
            return node1.type === node2.type && node1.key === node2.key;
        }
        // 比较左侧相同点, 直到不同点
        while(i <= e1 && i <= e2) {
            const oldNode = c1[i];
            const newNode = c2[i];

            if(isSameVNode(oldNode, newNode)) {
                patch(oldNode, newNode, container, null, parentComponent);
                i++;
            } else {
                break;
            }
        }

        // 比较右侧相同点 直到不同的地方
        while(i <= e1 && i <= e2) {
            const oldNode = c1[e1];
            const newNode = c2[e2];

            if(isSameVNode(oldNode, newNode)) {
                patch(oldNode, newNode, container, null, parentComponent);
                e1--;
                e2--;
            } else {
                break;
            }
        }

        //新的比老的多
        if(i > e1 && i <= e2) {
            let nextPos = e2+1;
            let anchor = nextPos < l2 ? c2[nextPos].el : null;
            while( i <= e2) {
                patch(null, c2[i], container, anchor, parentComponent);
                i++;
            }
        } else if(i > e2 && i <= e1 ) {
            while(i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }else{
            let oldStart = i;
            let newStart = i;
            let toBePatchCount = e2 - i + 1;
            let count = 0;
            let keyToIndexMap = new Map();
            let newIndexToOldIndex = new Array(toBePatchCount).fill(0);
            let maxNewIndex = 0;  
            let move = false; // 用来判断新children中有没有旧的节点是要移动

            for(let index = newStart; index <= e2; index++) {
                keyToIndexMap.set(c2[index].key, index);
            }

            for(let index = oldStart; index <= e1; index++) {
                let oldNode = c1[index];

                if(count >= toBePatchCount) {
                    hostRemove(oldNode.el);
                    continue;
                }
                let newIndex;
                if(oldNode.key !== null) {
                    newIndex = keyToIndexMap.get(oldNode.key);
                } else{
                    for(let i = newStart; i <= e2; i++) {
                        if(isSameVNode(oldNode, c2[i])) {
                            newIndex = i;
                            break;
                        }
                    }
                }

                if(newIndex === undefined) {
                    hostRemove(oldNode.el);
                } else {
                    // 如果nexIndex 对应的节点在老children中也有，那么就记录一下
                    // 记录的是在新children中该节点的位置与其在旧children节点位置的对应
                    // 数组的下标表示的是新children中该节点在要更新的这部分中的下标
                    // index + 1 是为了怕 index为0, 该数组中值为零则表示该节点属于新节点
                    newIndexToOldIndex[newIndex - newStart] = index + 1;

                    // 如果在新children中 节点的位置和oldChildren中节点的位置一样，
                    // 那么就不需要移动，就可以不用计算最长递增子序列，从而提高效率
                    if (newIndex >= maxNewIndex) {
                        maxNewIndex = newIndex;
                    } else {
                        move = true;
                    }

                    patch(oldNode, c2[newIndex], container, null, parentComponent);
                    count++;
                }
            }
            // 为什么要求最长递增子序列
            // 通过求解最长递增子序列， 我们可以减少节点的移动，只移动不是最长递增子序列中的节点
            // 从而提高效率
            let increasingNewIndexSequence = move ? getSequence(newIndexToOldIndex) : [];
            let j = increasingNewIndexSequence.length - 1;
            for(let i = toBePatchCount - 1; i >=0 ; i--) {
                let currIndex = i + newStart;
                let currNode = c2[currIndex];
                let anchor = currIndex + 1 < l2 ? c2[currIndex + 1].el : null;

                if(newIndexToOldIndex[i] === 0) {
                    // 该节点是新节点 需要创建
                    patch(null, currNode, container, anchor, parentComponent);
                } else if(move) {
                    // 说明有节点需要移动
                    if(j < 0 || increasingNewIndexSequence[j] !== i) {
                        // 说明这个节点不是那个最长递增子序列当中的节点
                        // 因此这个节点需要被重新插入位置
                        hostInsert(currNode.el, container, anchor);
                    } else {
                        // 说明该节点是最长自增子序列中的一个值
                        // 那么什么都不做，继续判断
                        j--;
                    }
                } 
            }
        }
    }
    function unMountChild(children) {
        children.forEach((child) => {
            hostRemove(child.el)
        })
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
            patch(null, v, container, null, parentComponent);
        })
    }
    
    function processComponent(n1, n2, container, parentComponent) {
        // 判断是要重新创建一个组件，还是更新一个组件
        // 创建一个新的组件
        if(!n1) {
            mountComponent(n2, container, parentComponent);
        } else {
            updateComponent(n1, n2);
        }
    }
    
    function mountComponent(vNode, container, parentComponent) {
        // 第一步创建一个组件实例对象
        const instance = (vNode.component = createComponentInstance(vNode, parentComponent));
    
        // 第二部设置组件实例对象的属性
        setupComponent(instance);
        setupRenderEffect(instance, vNode, container);
    }
    
    function setupRenderEffect(instance, vNode, container) {
        instance.update = effect(() => {
            if(!instance.isMounted) {
                let { proxy } = instance;
                if(!instance.render) return;

                const subTree = instance.render.call(proxy);
                instance.subTree = subTree;

                if(subTree) {
                    patch(null, subTree, container, null, instance);
                }
                vNode.el = subTree.el;
                instance.isMounted = true;
            } else {
                let { proxy } = instance;
                if(!instance.render) return;

                // 更新组件其实这里就是处理更新组件上的属性
                // 组件内部的元素 其实 就是更新元素的路数
                // 刚开始进来时 都是以组件的形式，然后在慢慢拆分为元素，
                // 总的来说 就是 组件上更新的是组件的属性，落到最后其实本质上还是更新元素
                // 所以这里就只用更新 组件属性， 而更新元素 在之前实现的元素更新里面已经实现了
                const { next, vNode } = instance;

                if(next) {
                    next.el = vNode.el;
                    updateComponentPreRender(instance, next);
                }


                const subTree = instance.render.call(proxy);
                const previewTree = instance.subTree;
                console.log('previewTree', previewTree);
                console.log('currentTree', subTree);

                instance.subTree = subTree;
                
                if(subTree) {
                    patch(previewTree, subTree, container, null, instance);
                }
                vNode.el = subTree.el;
            }
        }, {
            schedule() {
                // 视图异步更新，避免多次值被多次改变时，视图也要被多次更新
                // 减少性能开销
                console.log('schedule-update');
                queryJob(instance.update);
            }
        })
        
    }
    // 更新组件
    function updateComponent(n1, n2) {
        // 获取旧虚拟节点对应的组件实例对象
        const instance = (n2.component = n1.component);
        if(shouldUpdateComponent(n1, n2)) {
            // 组件上的属性发生了更新，那么组件实例对象上的props属性需要发生更新
            // 旧节点对应的组件实例对象的下一个更新的虚拟节点
            instance.next = n2;

            // 调用 setUpRenderEffect函数内effect()函数返回的runner 从而重新调用是实例对象上的render()函数，从而重新触发组件内元素的更新
            instance.update();
        } else {
            // 组件属性没有更新，那么只需要更新组件内的元素就行
            n2.el = n1.el;
            instance.vNode = n2;
        }
        

    }

    function updateComponentPreRender(instance, nextVNode) {
        // 更新组件实例对象对应的vNode
        instance.vNode = nextVNode;
        
        // 更新组件实例对象上的属性为对应的最新虚拟节点上的属性
        instance.props = nextVNode.props;

        // 更新完成之后 将instance.next 设置为null 因为已经当前组件实例对象已经更新完毕
        instance.next = null;

    }

    // 最终返回的是一个对象，这个对象里面有一个createApp属性
    // 这个属性对应的就是createApp.ts文件中 createAppApi方法返回的那个函数
    return {
        createApp: createAppApi(render)
    }
}

function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }

