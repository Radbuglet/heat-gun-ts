import { CanvasApplicationInterface } from "./CanvasApplication";

export enum Categories {
    VEL = "red",
    DTPOS = "lime"
}

export class CanvasGraph {
    static values : Map<Categories, number[]> = new Map();

    static log(category : Categories, y : number) {
        if (!this.values.has(category)) this.values.set(category, []);
        this.values.get(category).push(y);

        if (this.values.get(category).length > 1000) {
            this.values.get(category).shift();
        }
    }

    static render(app : CanvasApplicationInterface) {
        app.draw(ctx => {
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.moveTo(0, app.getHeight() / 2);
            ctx.lineTo(app.getWidth(), app.getHeight() / 2);

            ctx.stroke();
        });
        
        app.draw(ctx => {
            this.values.forEach((category_values, category) => {
                ctx.beginPath();

                ctx.strokeStyle = category;
                category_values.forEach((y, x) => {
                    if (x === 0) {
                        ctx.moveTo(x, app.getHeight() / 2 - y * 5);
                    } else {
                        ctx.lineTo(x, app.getHeight() / 2 - y * 5);
                    }
                });

                ctx.stroke();
            });
        });
    }
}