import Vector from "../helpers-common/helpers/Vector";
import { CanvasApplicationInterface } from "./CanvasApplication";
import { Rect } from "../helpers-common/helpers/Rect";

export class Camera {
    private zoom : number = 1;
    constructor(public lookvec : Vector, private app : CanvasApplicationInterface) {}

    attach() {
      const ctx = this.app.get_ctx();
      ctx.save();
      ctx.translate(this.app.getResolutionWidth() / 2, this.app.getResolutionHeight() / 2);
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

    get_view_rect() : Rect {
      return Rect.from_positions(
        this.toWorldPos(new Vector(0, 0)),
        this.toWorldPos(new Vector(this.app.getResolutionWidth(), this.app.getResolutionHeight()))
      );
    }

    dettach() {
      this.app.get_ctx().restore();
    }
  }