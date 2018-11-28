export function rainbow_color(col_conf : RainbowColorConfig) {
    return `hsl(${(Date.now() / col_conf.time_div) + (col_conf.add_to_time || 0)}, ${col_conf.saturation}%, ${col_conf.light}%)`;
}

export interface RainbowColorConfig {
    time_div : number
    saturation : number
    light : number
    add_to_time? : number
}
