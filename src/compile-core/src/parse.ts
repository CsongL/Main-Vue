import { NodeTypes } from "./ast";

const enum TagType {
    START,
    END
}

export function baseParse(content) {
    let context = createParserContext(content);
    return createRoot(parseChildren(context))
}


function parseChildren(context) {
    let nodes: any = []

    let node;
    let s = context.source;
    if(s.startsWith("{{")) {
        node = parseInterpolation(context);
    } else if(s[0] === '<') {
        node = parseElement(context);
    }

    nodes.push(node);
    
    
    return nodes;
}

function parseElement(context) {
    let elementNode = parseTag(context, TagType.START);

    parseTag(context, TagType.END);

    return elementNode;
}

function parseTag(context, tagType: TagType) {
    let match: any = /^<(\/?[a-z]+)/i.exec(context.source);
    let tag = match[1];

    advanceBy(context, match[0].length);
    advanceBy(context, 1);

    if(tagType === TagType.END) return

    return {
        type: NodeTypes.ELEMENT,
        tag
    }
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