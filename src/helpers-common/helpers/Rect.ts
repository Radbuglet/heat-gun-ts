import Vector from "./Vector";
import { Axis } from "./Axis";

export interface CollisionFace {
    axis: Axis
    sign: number
}

export const collision_sides = {
    LEFT: { axis: Axis.X, sign: -1 },
    RIGHT: { axis: Axis.X, sign: 1 },
    TOP: { axis: Axis.Y, sign: -1 },
    BOTTOM: { axis: Axis.Y, sign: 1 }
}

export class Rect {
    constructor(public top_left : Vector, public size : Vector) {

    }

    get_point(xP : number, yP : number) : Vector { // (Mostly just a helper to make my code cleaner. Exposing it just in case)
        return this.top_left.clone().mutadd(new Vector(this.get_width() * xP, this.get_height() * yP));
    }

    point_top_left() : Vector {
        return this.get_point(0, 0);
    }

    point_top_right() : Vector {
        return this.get_point(1, 0);
    }

    point_bottom_left() : Vector {
        return this.get_point(0, 1);
    }

    point_bottom_right() : Vector {
        return this.get_point(1, 1);
    }

    point_middle() : Vector {
        return this.get_point(0.5, 0.5);
    }

    get_x() : number {
        return this.top_left.getX();
    }

    get_y() : number {
        return this.top_left.getY();
    }

    get_size_clonevector() : Vector {
        return this.size.clone();
    }

    get_width() : number {
        return this.size.getX();
    }

    get_height() : number {
        return this.size.getY();
    }

    testcollision(other_rect : Rect) : boolean {
        /*const A = this;
        const B = other_rect;

        const w = 0.5 * (A.get_width() + B.get_width());
        const h = 0.5 * (A.get_height() + B.get_height());
        const dx = A.get_point_middle_clonevector().getX() - B.get_point_middle_clonevector().getX();
        const dy = A.get_point_middle_clonevector().getY() - B.get_point_middle_clonevector().getY();

        if (Math.abs(dx) <= w && Math.abs(dy) <= h) {
            const wy = w * dy;
            const hx = h * dx;

            if (wy > hx) {
                if (wy > -hx) {
                    return collision_sides.TOP;
                } else {
                    return collision_sides.LEFT;
                }
            } else {
                if (wy > -hx) {
                    return collision_sides.RIGHT;
                } else {
                    return collision_sides.BOTTOM;
                }
            }
        } else {
            return null;
        }*/

        //return { axis: Axis.X, sign: 1 };
        return (this.get_x() < other_rect.get_x() + other_rect.get_width() &&
              other_rect.get_x() < this.get_x() + this.get_width() &&
              this.get_y() < other_rect.get_y() + other_rect.get_height() &&
              other_rect.get_y() < this.get_y() + this.get_height());
    }

    get_margin_rect(size_px : number) : Rect {
        return new Rect(
            this.top_left.add(new Vector(size_px)),
            this.size.sub(new Vector(size_px))
        );
    }

    get_percent_margin_rect(percent : number) : Rect {
        return new Rect(
            this.top_left.add(this.size.mult(new Vector(percent))),
            this.size.mult(new Vector(1 - percent * 2))
        );
    }

    clone() : Rect {
        return new Rect(this.point_top_left(), this.get_size_clonevector())
    }

    clone_and_perform(func : (new_rect : Rect) => void) {
        const new_rect = this.clone();
        func(new_rect);
        return new_rect;
    }

    static from_positions(top_left : Vector, bottom_right : Vector) : Rect {
        return new Rect(top_left, bottom_right.sub(top_left));
    }

    static centered_around(center : Vector, size : Vector) : Rect {
        return new Rect(center.sub(size.div(new Vector(2))), size);
    }

    fill_rect(ctx : CanvasRenderingContext2D) {
        ctx.fillRect(this.top_left.getX(), this.top_left.getY(), this.get_width(), this.get_height());
    }

    stroke_rect(ctx : CanvasRenderingContext2D) {
        ctx.strokeRect(this.top_left.getX(), this.top_left.getY(), this.get_width(), this.get_height());
    }
}