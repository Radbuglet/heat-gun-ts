import { CanvasApplication } from "../../helpers-client/CanvasApplication";
import { MapLoader, ITile, Layers, OneWayDirections } from "../../helpers-common/MapLoader";
import { ClientWorld } from "../../platform-game/src/ClientWorld";
import { Camera } from "../../helpers-client/Camera";
import Vector from "../../helpers-common/helpers/Vector";
import { Rect } from "../../helpers-common/helpers/Rect";
import { rainbow_color } from "../../helpers-client/color";
import { wrap_num } from "../../helpers-common/helpers/Math";

const loader = new MapLoader();

window.onbeforeunload = function() { return "" };

loader.load_from_url("/map", () => {
    console.log("Loaded map!");

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    new Application(canvas, loader);
});

interface ILookPanState {
    start_mouse_position : Vector
    start_camera_position : Vector
}

enum HandleDragAxis {
    undetermined, x, y
}

interface IHandleMoveState {
    start_mouse_pos: Vector,
    start_obj_pos: Vector,
    axis : HandleDragAxis
}

interface IHandleScaleState {
    start_mouse_pos: Vector,
    start_obj_size: Vector,
    axis : HandleDragAxis
}

interface IMultiselectResolveState {
    cycle_index : number
    item_list : ITile[]
}

interface ICreateObjConfirmState {
    timer : number
    max_time : number
}

export class Application extends CanvasApplication {
    private static_world : ClientWorld = new ClientWorld(this.loader, this);
    private camera : Camera = new Camera(new Vector(0, 0));

    private look_pan_state : ILookPanState = null;
    private dragging_movepart_state : IHandleMoveState = null;
    private dragging_scalepart_state : IHandleScaleState = null;
    private currently_selected_object : ITile = null;
    private x_ray_mode : boolean = false;

    private last_visgroup_name : string = null;

    private new_tile_confirm_state : ICreateObjConfirmState = null;

    private palette : string[] = [
        "#0f0f0f",
        "#afaef4",
        "#88d127",
        "#6e5b43",
        "#605344",
        "#5a5a5a",
        "#333232",
        "#444f99",
        "#03a9f4",
        
    ];

    private multiselect_resolve_state : IMultiselectResolveState = null;

    private opt_grid = 5;

    constructor(canvas, private loader : MapLoader) {
        super(canvas);

        this.startup();
    }

    app_update() {
        if (this.look_pan_state !== null) {
            this.camera.lookvec.copyOther(this.look_pan_state.start_camera_position.add(this.look_pan_state.start_mouse_position.sub(this.get_mouse_position())));
        }

        if (this.currently_selected_object !== null) {
            if (this.dragging_movepart_state !== null) {
                const change_vec = this.dragging_movepart_state.start_mouse_pos.sub(this.get_world_mouse_pos());

                if (this.dragging_movepart_state.axis === HandleDragAxis.undetermined && change_vec.distance(new Vector(0)) > 20) {
                    this.dragging_movepart_state.axis = Math.abs(change_vec.getX()) > Math.abs(change_vec.getY()) ? HandleDragAxis.x : HandleDragAxis.y
                }

                if (this.dragging_movepart_state.axis === HandleDragAxis.x) {
                    this.currently_selected_object.rect.top_left.setX(this.dragging_movepart_state.start_obj_pos.getX() - change_vec.getX());
                }

                if (this.dragging_movepart_state.axis === HandleDragAxis.y) {
                    this.currently_selected_object.rect.top_left.setY(this.dragging_movepart_state.start_obj_pos.getY() - change_vec.getY());
                }
            }

            if (this.dragging_scalepart_state !== null) {
                const change_vec = this.dragging_scalepart_state.start_mouse_pos.sub(this.get_world_mouse_pos());

                if (this.dragging_scalepart_state.axis === HandleDragAxis.undetermined && change_vec.distance(new Vector(0)) > 20) {
                    this.dragging_scalepart_state.axis = Math.abs(change_vec.getX()) > Math.abs(change_vec.getY()) ? HandleDragAxis.x : HandleDragAxis.y
                }

                if (this.dragging_scalepart_state.axis === HandleDragAxis.x) {
                    this.currently_selected_object.rect.size.setX(this.dragging_scalepart_state.start_obj_size.getX() - change_vec.getX());
                }

                if (this.dragging_scalepart_state.axis === HandleDragAxis.y) {
                    this.currently_selected_object.rect.size.setY(this.dragging_scalepart_state.start_obj_size.getY() - change_vec.getY());
                }
            }

            this.currently_selected_object.rect.top_left.setX(Math.floor(this.currently_selected_object.rect.top_left.getX() / this.opt_grid) * this.opt_grid);
            this.currently_selected_object.rect.top_left.setY(Math.floor(this.currently_selected_object.rect.top_left.getY() / this.opt_grid) * this.opt_grid);

            this.currently_selected_object.rect.size.setX(Math.floor(this.currently_selected_object.rect.size.getX() / this.opt_grid) * this.opt_grid);
            this.currently_selected_object.rect.size.setY(Math.floor(this.currently_selected_object.rect.size.getY() / this.opt_grid) * this.opt_grid);
        }

        if (this.new_tile_confirm_state !== null) {
            this.new_tile_confirm_state.timer -= 1;
            if (this.new_tile_confirm_state.timer < 0) {
                this.new_tile_confirm_state = null;
            }
        }
    }

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number) {
        this.draw(() => {
            this.camera.attach(ctx, width, height);
            this.static_world.render_world(null, -1, {
                hovered_objects: this.get_hovered_objects(),
                selected_object: this.currently_selected_object,
                x_ray: this.x_ray_mode
            }); 

            if (this.currently_selected_object !== null) {
                this.draw(() => {
                    ctx.strokeStyle = rainbow_color({
                        light: 50,
                        saturation: 75,
                        time_div: 20
                    });
                    ctx.lineWidth = 4;
                    this.currently_selected_object.rect.stroke_rect(ctx);

                    this.draw_handle(this.get_pos_handle_move(), this.is_move_handle_selected());
                    this.draw_handle(this.get_pos_handle_scale(), this.is_scale_handle_selected());
                });

                if (this.dragging_scalepart_state !== null && this.dragging_scalepart_state.axis !== HandleDragAxis.undetermined) {
                    ctx.strokeStyle = rainbow_color({
                        light: 75,
                        saturation: 100,
                        time_div: 20
                    });
                    ctx.lineWidth = 4;
                    this.currently_selected_object.rect.clone_and_perform(rect => rect.size.copyOther(this.dragging_scalepart_state.start_obj_size)).stroke_rect(ctx);
                }

                if (this.dragging_movepart_state !== null && this.dragging_movepart_state.axis !== HandleDragAxis.undetermined) {
                    this.draw(ctx => {
                        ctx.strokeStyle = rainbow_color({
                            light: 75,
                            saturation: 100,
                            time_div: 20
                        });
                        ctx.lineWidth = 4;

                        ctx.beginPath();
                        ctx.moveTo(this.dragging_movepart_state.start_obj_pos.getX(), this.dragging_movepart_state.start_obj_pos.getY());
                        ctx.lineTo(this.currently_selected_object.rect.top_left.getX(), this.currently_selected_object.rect.top_left.getY());

                        ctx.stroke();
                    });

                    
                }
            }

            if (this.multiselect_resolve_state !== null) {
                this.multiselect_resolve_state.item_list.forEach(tile => {
                    this.draw(() => {
                        ctx.strokeStyle = rainbow_color({
                            light: 50,
                            saturation: 75,
                            time_div: 20
                        });
                        ctx.setLineDash([5, 5]);
                        ctx.lineWidth = 4;
                        tile.rect.stroke_rect(ctx);
                    });
                });
            }

            if (this.new_tile_confirm_state !== null) {
                this.draw(() => {
                    ctx.strokeStyle = "red";
                    ctx.globalAlpha = this.new_tile_confirm_state.timer / this.new_tile_confirm_state.max_time;
                    ctx.lineWidth = 4;
                    this.get_new_tile_rect().stroke_rect(ctx);
                });
            }
            
            this.static_world.render_bounding_box();

            this.camera.dettach(ctx);
        });

        this.draw(() => {
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, width, 50);
    
            ctx.fillStyle = "#fff";
    
            ctx.font = "15px Ubuntu Mono, monospace";
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
    
            ctx.fillText("HeatEdit v2 | N: New object | Left click: Select | Drag right click: Pan", 10, 25);
            ctx.textAlign = "right";
            ctx.fillText("E: Export", width - 10, 25);
        });
    }



    app_keydown(e : KeyboardEvent) {
        if (this.currently_selected_object !== null) {
            if (e.code === "Backspace") {
                this.static_world.tiles = this.static_world.tiles.filter(tile => tile !== this.currently_selected_object);
                this.static_world.fix_tile_indices();
                this.currently_selected_object = null;
                this.dragging_movepart_state = null;
                this.dragging_scalepart_state = null;
                this.multiselect_resolve_state = null;
            }

            if (e.code === "ArrowUp") {
                this.static_world.tiles.splice(this.currently_selected_object.absolute_tile_index, 1);
                this.static_world.tiles.push(this.currently_selected_object);
                this.static_world.fix_tile_indices();
            }

            if (e.code === "KeyG") {
                this.currently_selected_object.bullet_phased = !(this.currently_selected_object.bullet_phased || false);
            }

            if (e.code === "KeyH") {
                this.currently_selected_object.layer = this.currently_selected_object.layer === Layers.dec ? Layers.obj : Layers.dec;
            }

            if (e.code === "KeyF") {
                this.currently_selected_object.force_original_color = !(this.currently_selected_object.force_original_color || false);
            }

            if (e.code === "KeyO") {
                this.currently_selected_object.one_way = (typeof this.currently_selected_object.one_way === "number" ? this.currently_selected_object.one_way : -1) + 1;
                if (this.currently_selected_object.one_way === 4) this.currently_selected_object.one_way = null;
            }

            this.palette.forEach((color, i) => {
                if (e.code === "Digit" + (i + 1)) {
                    this.currently_selected_object.color = color;
                }
            });
        }

        if (this.multiselect_resolve_state !== null) {
            if (e.code === "KeyZ") {
                this.multiselect_resolve_state.cycle_index += 1;

                if (this.multiselect_resolve_state.cycle_index > this.multiselect_resolve_state.item_list.length - 1) {
                    this.multiselect_resolve_state.cycle_index = 0;
                }

                this.currently_selected_object = this.multiselect_resolve_state.item_list[this.multiselect_resolve_state.cycle_index];
            }
        }

        if (e.code === "KeyD") {
            const visgroup = prompt("Enter visgroup", this.last_visgroup_name || "");
            if (typeof visgroup === "string") {
                this.currently_selected_object.visgroup = visgroup;

                if (visgroup === "") {
                    delete this.currently_selected_object.visgroup;
                }

                this.last_visgroup_name = visgroup;
            }
        }

        if (e.code === "KeyN") {
            if (this.new_tile_confirm_state === null || this.new_tile_confirm_state.timer < this.new_tile_confirm_state.max_time / 2) {
                this.new_tile_confirm_state = {
                    timer: 50,
                    max_time: 50
                }
            } else {
                this.new_tile_confirm_state = null;

                const rect = this.get_new_tile_rect();

                this.static_world.tiles.push({
                    color: this.palette[0],
                    x: rect.get_x(), y: rect.get_y(),
                    w: rect.get_width(), h: rect.get_height(),
                    layer: Layers.obj,
                    rect: rect
                });

                this.static_world.fix_tile_indices();
            }
        }

        if (e.code === "KeyQ") {
            if (confirm("Delete everything?")) {
                this.static_world.tiles = [];
                this.currently_selected_object = null;
                this.dragging_movepart_state = null;
                this.dragging_scalepart_state = null;
                this.multiselect_resolve_state = null;
            }
        }

        if (e.code === "KeyX") {
            this.x_ray_mode = !this.x_ray_mode;
        }

        if (e.code === "KeyE") {
            const subwindow = open();
            subwindow.onload = () => {
                subwindow.document.write("<pre>"+JSON.stringify(
                    this.static_world.tiles.map(tile => {
                        const ntile = {...tile};
                        delete ntile['absolute_tile_index'];
                        ntile.x = ntile.rect.get_x();
                        ntile.y = ntile.rect.get_y();
                        ntile.w = ntile.rect.get_width();
                        ntile.h = ntile.rect.get_height();
                        delete ntile['rect'];
                        return ntile;
                    }), null, 2
                ) + "</pre>");
            }
        }
    }

    app_keyup() {

    }


    
    app_mousedown(e : MouseEvent) {
        if (e.button === 0) {
            if (this.currently_selected_object !== null && (this.is_move_handle_selected() || this.is_scale_handle_selected())) {
                if (this.is_move_handle_selected()) {
                    this.dragging_movepart_state = {
                        axis: HandleDragAxis.undetermined,
                        start_mouse_pos: this.get_world_mouse_pos().clone(),
                        start_obj_pos: this.currently_selected_object.rect.top_left.clone()
                    }
                }

                if (this.is_scale_handle_selected()) {
                    this.dragging_scalepart_state = {
                        axis: HandleDragAxis.undetermined,
                        start_mouse_pos: this.get_world_mouse_pos().clone(),
                        start_obj_size: this.currently_selected_object.rect.size.clone()
                    }
                }
            } else {
                const hovered_objects = this.get_hovered_objects();
            
                if (hovered_objects.length > 0) {
                    if (hovered_objects.length === 1) {
                        this.currently_selected_object = hovered_objects[0];
                        this.multiselect_resolve_state = null;
                    } else {
                        this.currently_selected_object = hovered_objects[0];
                        this.multiselect_resolve_state = {
                            cycle_index: 0,
                            item_list: hovered_objects
                        }
                    }
                } else {
                    this.currently_selected_object = null;
                    this.multiselect_resolve_state = null;
                }
            }
        }
        if (e.button === 2) {
            this.look_pan_state = {
                start_mouse_position: this.get_mouse_position().clone(),
                start_camera_position: this.camera.lookvec.clone()
            }
        }
    }

    app_mouseup(e : MouseEvent) {
        if (e.button === 0) {
            this.dragging_movepart_state = null;
            this.dragging_scalepart_state = null;
        }

        if (e.button === 2) {
            this.look_pan_state = null;
        }
    }


    // Helpers
    get_world_mouse_pos() {
        return this.camera.toWorldPos(this.get_mouse_position(), this.getResolutionWidth(), this.getResolutionHeight())
    }

    get_hovered_objects() : ITile[] {
        return this.static_world.tiles.filter(tile => tile.rect.testcollision(Rect.centered_around(this.get_world_mouse_pos(), new Vector(1, 1))));
    }


    get_pos_handle_move() {
        return this.currently_selected_object.rect.point_top_left();
    }

    is_move_handle_selected() : boolean {
        return this.get_pos_handle_move().distance(this.get_world_mouse_pos()) < 10;
    }


    get_pos_handle_scale() {
        return this.currently_selected_object.rect.point_bottom_right();
    }

    is_scale_handle_selected() : boolean {
        return this.get_pos_handle_scale().distance(this.get_world_mouse_pos()) < 10;
    }

    get_new_tile_rect() : Rect {
        return Rect.centered_around(
            this.camera.toWorldPos(new Rect(new Vector(0, 0), new Vector(this.getResolutionWidth(), this.getResolutionHeight())).point_middle(), this.getResolutionWidth(), this.getResolutionHeight()).div(new Vector(this.opt_grid)).floor().mult(new Vector(this.opt_grid)),
            new Vector(100)
        );
    }

    draw_handle(pos : Vector, hovered : boolean) {
        this.draw(ctx => {
            ctx.fillStyle = rainbow_color({
                light: hovered ? 75 : 50,
                saturation: 75,
                time_div: 20
            });
            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.ellipse(pos.getX(), pos.getY(), 10, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        });
    }
}