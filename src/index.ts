export * from "./runtime-dom"

import { baseCompile } from "./compile-core/src";
import * as runtimeDom from './runtime-dom';
import { registerRuntimeCompile } from './runtime-core'

function compileToFunction(template) {
    const { code } = baseCompile(template);

    const render = new Function('Vue', code)(runtimeDom);

    return render;
}

registerRuntimeCompile(compileToFunction);