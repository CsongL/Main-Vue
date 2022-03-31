import { NodeTypes } from "./ast";



export function baseParse(content) {
    let context = createParserContext(content);
    return createRoot(parseChildren(context))
}


function parseChildren(context) {
    let nodes: any = []

    console.log(context)
    let node;
    if(context.source.startsWith("{{")) {
        node = parseInterpolation(context);
    }

    nodes.push(node);
    
    
    return nodes;
}


function parseInterpolation(context) {

    const beginDelimiter = "{{";
    const closeDelimiter = "}}";


    let closeIndex = context.source.indexOf(closeDelimiter, beginDelimiter.length);


    advanceBy(context, beginDelimiter.length);

    const rawContentLength = closeIndex - beginDelimiter.length;

    const content = context.source.slice(0, rawContentLength).trim();

    advanceBy(context, rawContentLength + closeDelimiter.length);

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        }
    }
}

function advanceBy(context, length: number) {
    context.source = context.source.slice(length);
}

function createRoot(children) {
    return {
        children
    }
}

function createParserContext(content) {
    return {
        source: content,
    }
}