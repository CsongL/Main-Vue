export const extend = Object.assign;

export const EMPTY_OBJECT = {};

export const isObject = (val) => {
    return val !== null && typeof val === 'object';
}

export const hasChanged = (value, oldValue) => {
    return !Object.is(value, oldValue);
}


export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export const camelize = (str) => {
    return str.replace(/-(\w)/, (_, c) => {
        return c.toUpperCase();
    })
}

export const captialize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}