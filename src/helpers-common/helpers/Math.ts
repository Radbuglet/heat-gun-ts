export function round(x: number, n: number) {
    return Math.floor(x * Math.pow(10, n)) / Math.pow(10, n);
}

export function num_in_range(min: number, num: number, max: number) {
    return min <= num && num <= max;
}

export function num_in_range_noinclude(min: number, num: number, max: number) {
    return min < num && num < max;
}

export function clamp_num(min : number, num : number, max : number) : number {
    return Math.min(Math.max(num, min), max);
}

export function torad(deg: number) {
    return deg * (Math.PI / 180);
}

export function todeg(rad: number) {
    return rad * 180 / Math.PI;
}

export function calculate_ticks(delta : number, frame_rate : number = 60) {
    return delta / ((1 / frame_rate) * 1000);
    //return 1;
}

export function wrap_num(num : number, max : number) {
    if (num >= max) return 0;
    if (num < 0) return max - 1;
    return num;
}

export function randint(min : number, max : number) : number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}