
// 存放各个更新视图任务
const queue: any[] = [];

// 用来避免向微任务队列中放入多个相同的flushJob()函数
// 只有在第一次调用时, 会将flushJob()函数放入微任务队列中，
// 即使再有新的不同的任务进来，也只是将新的任务放入queue中，而不会再将其flushJob()函数放入微任务队列中
// 因为flushJob()是会将queue中的任务都拿出来运行的，所以没必要在微任务队列中加入多个flushJob()
// 如果放入多个flushJob() 其实也就是导致后面的呢queue为空，没有可执行的内容，所以不划算
let isFlushPending = false;

export function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve(); 
}

export function queryJob(job) {
    if(!queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
}

function queueFlush() {
    if(isFlushPending) return;
    isFlushPending = true;
    nextTick(flushJob);
}

function flushJob() {
    isFlushPending = false;
    let job;
    while((job = queue.shift())) {
        if(job) {
            job();
        }
    }
}