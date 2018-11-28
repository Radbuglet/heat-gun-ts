import Vector from "../helpers-common/helpers/Vector";
import { calculate_ticks } from "../helpers-common/helpers/Math";
import { CanvasGraph, Categories } from "./CanvasGraph";

export abstract class CanvasApplicationInterface {
  abstract app_keydown(e : KeyboardEvent);
  abstract app_keyup(e : KeyboardEvent);
  abstract app_mousedown(e : MouseEvent);
  abstract app_mouseup(e : MouseEvent);

  abstract app_update(dt : number, ticks_passed : number);
  abstract app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number);


  abstract draw(fn : (ctx : CanvasRenderingContext2D) => void)
  abstract resizecanvas();
  abstract getWidth() : number;
  abstract getHeight() : number;

  abstract get_keys_down() : Map<string, boolean>;
  abstract get_mouse_position() : Vector;
  abstract is_mouse_down() : boolean;
  abstract is_right_mouse_down() : boolean;
  abstract get_fps() : number;
  abstract get_total_frames() : number;
  abstract is_mouse_down_frame() : boolean;

  abstract get_pointer_mode() : string;
  abstract set_pointer_mode(s : string);
}

export abstract class CanvasSubApplication extends CanvasApplicationInterface {
  constructor(protected main : CanvasApplication) {
    super();
  }

  abstract app_keydown(e : KeyboardEvent);
  abstract app_keyup(e : KeyboardEvent);
  abstract app_mousedown(e : MouseEvent);
  abstract app_mouseup(e : MouseEvent);

  abstract app_update(dt : number, ticks_passed : number);
  abstract app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number);

  draw(fn : (ctx : CanvasRenderingContext2D) => void) {
    this.main.draw(fn);
  }

  resizecanvas() {
    this.main.resizecanvas();
  }

  getWidth() : number {
    return this.main.getWidth();
  }

  getHeight() : number {
    return this.main.getHeight();
  }

  get_keys_down() : Map<string, boolean> {
    return this.main.get_keys_down();
  }

  get_mouse_position() : Vector {
    return this.main.get_mouse_position();
  }

  is_mouse_down() : boolean {
    return this.main.is_mouse_down();
  }

  is_right_mouse_down() : boolean {
    return this.main.is_right_mouse_down();
  }

  get_fps() : number {
    return this.main.get_fps();
  }

  get_total_frames() : number {
    return this.main.get_total_frames();
  }

  is_mouse_down_frame() : boolean {
    return this.main.is_mouse_down_frame();
  }

  get_pointer_mode() : string {
    return this.main.get_pointer_mode();
  }

  set_pointer_mode(s : string) {
    this.main.set_pointer_mode(s);
  }
}

export abstract class CanvasApplication extends CanvasApplicationInterface {
    private ctx : CanvasRenderingContext2D;

    private last_sec : number = performance.now();
    private last_tick : number = performance.now();
    private frames : number = 0;

    private keys_down : Map<string, boolean> = new Map();
    get_keys_down() {
      return this.keys_down;
    }

    private mouse_position = new Vector(0, 0);
    get_mouse_position() {
      return this.mouse_position;
    }

    private mouse_down : boolean = false;
    is_mouse_down() {
      return this.mouse_down;
    }

    private right_mouse_down : boolean = false;
    is_right_mouse_down() {
      return this.right_mouse_down;
    }

    private fps : number = -1;
    get_fps() {
      return this.fps;
    }

    private total_frames : number = 0;
    get_total_frames() {
      return this.total_frames;
    }

    private mousedown_frame : boolean = false;
    is_mouse_down_frame() {
      return this.mousedown_frame;
    }

    private pointer_mode : string = "default";
    get_pointer_mode() {
      return this.pointer_mode;
    }

    set_pointer_mode(m) {
      this.pointer_mode = m;
    }

    protected pixel_ratio : number;

    protected fps_cap : number = 10000;

    constructor(private canvas : HTMLCanvasElement) {
      super();
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      this.resizecanvas();
      window.addEventListener("resize", this.resizecanvas.bind(this));
      window.addEventListener("keydown", this.keypress_down_handler.bind(this));
      window.addEventListener("keyup", this.keypress_up_handler.bind(this));

      this.canvas.addEventListener("mousemove", this.mousemoved_handler.bind(this));
      this.canvas.addEventListener("mousedown", this.mouse_down_handler.bind(this));

      window.addEventListener("contextmenu", e => {
        e.preventDefault();
      });

      window.addEventListener("mouseup", this.mouse_up_handler.bind(this));
    }

    startup() {
      this.tick();
    }

    abstract app_keydown(e : KeyboardEvent);
    abstract app_keyup(e : KeyboardEvent);
    abstract app_mousedown(e : MouseEvent);
    abstract app_mouseup(e : MouseEvent);

    abstract app_update(dt : number, ticks_passed : number);
    abstract app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number);

    draw(fn : (ctx : CanvasRenderingContext2D) => void) {
        this.ctx.save();
        fn(this.ctx);
        this.ctx.restore();
    }

    private keypress_down_handler(e : KeyboardEvent) {
        this.keys_down.set(e.code, true);
        this.app_keydown(e);
      }

    private keypress_up_handler(e : KeyboardEvent) {
        this.keys_down.set(e.code, false);
        this.app_keyup(e);
    }

    private mousemoved_handler(e : MouseEvent) {
      this.mouse_position.setX(e.clientX);
      this.mouse_position.setY(e.clientY);
    }

    private mouse_down_handler(e : MouseEvent) {
        if (e.button === 0) {
          this.mouse_down = true;
          this.mousedown_frame = true;
        }
  
        if (e.button === 2) {
          this.right_mouse_down = true;
        }
  
        this.app_mousedown(e);
      }

    private mouse_up_handler(e : MouseEvent) {
      if (e.button === 0) {
        this.mouse_down = false;
      }

      if (e.button === 2) {
        this.right_mouse_down = false;
      }

      this.app_mouseup(e);
    }

    resizecanvas() {
        const pixel_ratio = window.devicePixelRatio || 1;
  
        this.canvas.width = window.innerWidth * pixel_ratio;
        this.canvas.height = window.innerHeight * pixel_ratio;
  
        this.canvas.style.width = window.innerWidth + "px";
        this.canvas.style.height = window.innerHeight + "px";
  
        this.ctx.scale(pixel_ratio, pixel_ratio);
        this.pixel_ratio = pixel_ratio;
      }

    private tick() {
      const dt = performance.now() - this.last_tick;
      this.last_tick = performance.now();
      
      if (dt < (1 / this.fps_cap) * 1000) {
        return;
      }

      const ticks_passed = calculate_ticks(dt);
      this.frames++;

      if (performance.now() > this.last_sec + 1000) {
        this.last_sec = performance.now();
        this.fps = this.frames;
        this.frames = 0;
      }

      this.total_frames += 1;

      this.pointer_mode = "default";

      // CanvasGraph.log(Categories.VEL, dt);
      // CanvasGraph.log(Categories.DTPOS, ticks_passed);

      this.app_update(dt, ticks_passed);
      this.draw(() => {
        //this.ctx.scale(this.pixel_ratio, this.pixel_ratio);
        this.ctx.clearRect(0, 0, this.getWidth(), this.getHeight());
        this.app_render(this.ctx, this.getWidth(), this.getHeight(), ticks_passed);
      });

      if (this.pointer_mode !== this.canvas.style.cursor) {
        this.canvas.style.cursor = this.pointer_mode;
      }

      this.mousedown_frame = false;

      window.requestAnimationFrame(this.tick.bind(this));
    }

    getWidth() {
      return this.canvas.width / this.pixel_ratio;
    }

    getHeight() {
      return this.canvas.height / this.pixel_ratio;
    }
  }