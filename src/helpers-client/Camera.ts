import Vector from "../helpers-common/helpers/Vector";

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

    toWorldPos(pos, w, h) {
      return pos.add(this.lookvec).sub(new Vector(w / 2, h / 2));
    }

    dettach(ctx) {
      ctx.restore();
    }
  }