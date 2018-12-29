import { rainbow_color } from "./color";

export function get_theme_rainbow() {
    return rainbow_color({
        light: 80,
        saturation: 100,
        time_div: 20
    });
}

export function get_theme_dark() {
    return "#3f3d3fdd";
}


export function get_theme_red() {
    return "#FF5555";
}