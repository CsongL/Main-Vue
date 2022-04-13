import { isReadonly } from "../../reactivity/src/reactivity";
import { NodeTypes } from "./ast";

const enum TagType {
    START,
    END
}

export function baseParse(content) {
    let context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}


function parseChildren(context, ancestors) {
    let nodes: any = []

    while(!isEnd(context, ancestors)){
        let node;
        let s = context.source;
        if(s.startsWith("{{")) {
            node = parseInterpolation(context);
        } else if(s[0] === '<') {
            node = parseElement(context, ancestors);
        }

        if(!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    
    
    return nodes;
}

function parseText(context) {
    let endTokens = ['<', '{{'];
    let endIndex = context.source.length;
    for(let i = 0; i < endTokens.length; i++) {
        let index = context.source.indexOf(endTokens[i]);
        if(index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseElement(context, ancestors) {
    let elementNode: any = parseTag(context, TagType.START);
    ancestors.push(elementNode);
    elementNode.children = parseChildren(context, ancestors);
    ancestors.pop();

    console.log(elementNode);
    if(startWithEndTag(context.source, elementNode.tag)) {
        parseTag(context, TagType.END);
    } else {
        throw new Error(`缺少结束标签:${elementNode.tag}`);
    }


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

    const content = parseTextData(context, rawContentLength).trim();

    advanceBy(context, closeDelimiter.length);

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        }
    }
}

function isEnd(context, ancestors) {
    let s = context.source;
    if(s.startsWith('</')) {
        for(let i = ancestors.length - 1; i >= 0; i--) {
            if(startWithEndTag(s, ancestors[i].tag)) {
                return true;
            }
        }
    }
    // if(parentTag && s.startsWith(`</${parentTag}>`) ) {
    //     return true;
    // }
    return !s
}

function startWithEndTag(source, tag) {
    return source.startsWith('</') && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);

    advanceBy(context, length);
    return content;
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