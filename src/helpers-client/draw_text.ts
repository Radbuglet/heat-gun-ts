import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { CanvasApplicationInterface } from "./CanvasApplication";

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
            });

            new_text.push([]); // Reinsert original line breaks
            current_width_px = 0;
        });
    });

    return new_text;
}

export function draw_text(app : CanvasApplicationInterface, x : number, y : number, font : string, line_break_size : number, text_lines : ITextComponent[][]) {
    app.draw(ctx => {
        ctx.font = font;
        ctx.textAlign = "start";
        ctx.textBaseline = "top";

        let drawing_y = y;

        text_lines.forEach(text_line => {
            let drawing_x = x;

            text_line.forEach((text_part : ITextComponent) => {
                app.draw(ctx => {
                    const text_part_width = ctx.measureText(text_part.text).width;

                    if (text_part.bg) {
                        ctx.fillStyle = text_part.bg;
                        ctx.fillRect(drawing_x, drawing_y, text_part_width, line_break_size);
                    }
                    
                    ctx.fillStyle = text_part.color;
                    ctx.fillText(text_part.text, drawing_x, drawing_y);
                    
                    drawing_x += text_part_width;
                });
            });

            drawing_y += line_break_size;
        });
    });
}