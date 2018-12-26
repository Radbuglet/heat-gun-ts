import Vector from "../helpers-common/helpers/Vector";
import { CanvasApplicationInterface } from "./CanvasApplication";

export class Camera {
    private zoom : number = 1;
    constructor(public lookvec : Vector) {}

    attach(ctx : CanvasRenderingContext2D, w : number, h : number) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-Math.floor(this.lookvec.getX()), -Math.floor(this.lookvec.getY()));
    }

    setZoom(f : number) {
      this.zoom = f;
    }

    getZoom() : number {
      return this.zoom;
    }

    toWorldPos(pos) : Vector {
      return pos.sub(new Vector(this.app.getResolutionWidth() / 2, this.app.getResolutionHeight() / 2)).div(new Vector(this.zoom)).add(this.lookvec.floor());
    }

    dettach(ctx) {
      ctx.restore();
    get_view_rect() : Rect {
      return Rect.from_positions(
        this.toWorldPos(new Vector(0, 0)),
        this.toWorldPos(new Vector(this.app.getResolutionWidth(), this.app.getResolutionHeight()))
      );
    }
    }
  }