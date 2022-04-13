import { NodeTypes } from '../src/ast';
import { baseParse } from '../src/parse';

describe("Parse", () => {
    describe("interpolation", () => {
        test("simple interpolation", () => {
            const ast = baseParse("{{ message  }}");

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: "message",
                }
            })
        })
    })

    describe("Element", () => {
        test("test element", () => {
            const ast = baseParse("<div></div>")

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: 'div',
                children: []
            })
        })
    })

    describe("Text", () => {
        test("test text", () => {
            const ast = baseParse("some message")

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: 'some message'
            })
        })
    })

    test("complex text", () => {
        const ast = baseParse("<div>hi,{{message}}</div>");

        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [
                {
                    type: NodeTypes.TEXT,
                    content: 'hi,'
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: "message",
                    }
                }
            ]
        })
    })

    test("nested element", () => {
        const ast = baseParse("<div><p>hi</p>{{message}}</div>");

        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: 'div',
            children: [{
                    type: NodeTypes.ELEMENT,
                    tag: 'p',
                    children: [
                        {
                            type: NodeTypes.TEXT,
                            content: 'hi'
                        }
                    ]
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content: "message",
                    }
                }
            ]
        })
    })
})

