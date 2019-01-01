import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { CanvasApplicationInterface } from "./CanvasApplication";
import { Rect } from "../helpers-common/helpers/Rect";
import Vector from "../helpers-common/helpers/Vector";

// @TODO remove newline_after flag and implement in a different way
export function limit_line_size(app : CanvasApplicationInterface, font : string, text : ITextComponent[][], max_line_size : number) : ITextComponent[][] {
    const new_text : ITextComponent[][] = [[]];

    app.draw(ctx => {
        let current_width_px = 0;
        ctx.font = font;

        text.forEach(line => {
            line.forEach(component => {
                let latest_component = { ...component };
                latest_component.text = "";
    
                component.text.split('').forEach(char => {
                    current_width_px += ctx.measureText(char).width;
                    latest_component.text += char;
    
                    if (current_width_px >= max_line_size) {
                        new_text[new_text.length - 1].push(latest_component); // Commit the latest component
                        new_text.push([]); // Add a new line
    
                        // Create a new empty text component
                        latest_component = { ...component };
                        latest_component.text = "";
    
                        // Reset line width
                        current_width_px = 0; 
                    }
                });
    
                // Commit the latest component
                new_text[new_text.length - 1].push(latest_component);

                current_width_px += component.space_size_after || 0;
            });

            new_text.push([]); // Reinsert original line breaks
            current_width_px = 0;
        });
    });

    return new_text;
}

export function draw_text(app : CanvasApplicationInterface, x : number, y : number, font : string, line_break_size : number, text_lines : ITextComponent[][], centered : boolean = false) {
    app.draw(ctx => {
        ctx.font = font;
        ctx.textAlign = "start";
        ctx.textBaseline = "top";

        let drawing_y = y;

        text_lines.forEach(text_line => {
            let line_width = get_line_size(app, font, text_line);

            let drawing_x = centered ? x - line_width / 2 : x;

            text_line.forEach((text_part : ITextComponent) => {
                app.draw(ctx => {
                    const text_part_width = ctx.measureText(text_part.text).width + (text_part.space_size_after || 0);
                    const rect = new Rect(new Vector(drawing_x, drawing_y), new Vector(text_part_width, line_break_size));
                    const hover = Rect.centered_around(app.get_mouse_position(), new Vector(1, 1)).testcollision(rect);

                    if (text_part.bg) {
                        ctx.fillStyle = (typeof text_part.hover_bg === "string" && hover) ? text_part.hover_bg :text_part.bg;
                        rect.fill_rect_pixelfixed(ctx);
                    }

                    if (hover && (
                        typeof text_part.click_func_action === "function" ||
                        typeof text_part.click_url_action === "string"
                    )) app.set_pointer_mode("pointer");

                    if (hover && app.is_mouse_down_frame()) {
                        if (typeof text_part.click_func_action === "function") text_part.click_func_action();
                        if (typeof text_part.click_url_action === "string") open(text_part.click_url_action);
                    }
                    
                    ctx.fillStyle = (typeof text_part.hover_color === "string" && hover) ? text_part.hover_color :text_part.color;
                    ctx.fillText(text_part.text, drawing_x, drawing_y);
                    
                    drawing_x += text_part_width;
                });
            });

            drawing_y += line_break_size;
        });
    });
}

export function get_line_size(app : CanvasApplicationInterface, font_family : string, text : ITextComponent[]) : number {
    let width = 0;

    app.draw(ctx => {
        ctx.font = font_family;
        text.forEach(part => {
            width += ctx.measureText(part.text).width + (part.space_size_after || 0);
        });
    });

    return width;
}

export function left_right_alignment(app : CanvasApplicationInterface, font : string, left_text : ITextComponent[], right_text : ITextComponent[], spacer_component : ITextComponent, width : number) : ITextComponent[] {
    const my_spacer_component = {...spacer_component};
    my_spacer_component.space_size_after = width - get_line_size(app, font, left_text) - get_line_size(app, font, right_text);
    return left_text.concat([my_spacer_component]).concat(right_text);
}