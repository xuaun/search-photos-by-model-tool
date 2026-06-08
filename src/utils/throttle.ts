export default function throttle(func: Function, ms: number) {
    let lastTimestamp: number | null = null;
    let tid: ReturnType<typeof setTimeout> | undefined = undefined;

    function ret(this: any, ...args: any[]) {
        tid != null && clearTimeout(tid);
        const timestamp = Date.now();
        if (lastTimestamp != null && timestamp - lastTimestamp >= ms) {
            func.apply(this, args);
            lastTimestamp = null;
        } else {
            tid = setTimeout(() => ret.apply(this, args), ms);
            lastTimestamp = timestamp;
        }
    }

    return ret;
}
