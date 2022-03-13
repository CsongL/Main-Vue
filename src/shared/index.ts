export const extend = Object.assign;

export const isObject = (val) => {
    return val !== null && typeof val === 'object';
}

export const hasChanged = (value, oldValue) => {
    return !Object.is(value, oldValue);
}


export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);