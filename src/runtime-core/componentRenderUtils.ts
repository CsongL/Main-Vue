export function shouldUpdateComponent(prevVNode, nextVNode) {
    let { props: prevProps } = prevVNode;
    let { props: nextProps } = nextVNode;

    for(let key in nextProps) {
        if(nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}