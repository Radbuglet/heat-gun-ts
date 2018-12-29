import { World } from "../../helpers-common/World";
import { ClientPlayer } from "./ClientPlayer";
import { CanvasApplicationInterface } from "../../helpers-client/CanvasApplication";
import { Layers, OneWayDirections, MapLoader, ITile } from "../../helpers-common/MapLoader";
import { rainbow_color } from "../../helpers-client/color";
import { Axis } from "../../helpers-common/helpers/Axis";
import { ParticleSystem } from "../../helpers-client/ParticleSystem";
import { IUpdate } from "../../helpers-common/helpers/IUpdate";
import { TPZONE_LEFT, TPZONE_TOP, TPZONE_RIGHT, TPZONE_BOTTOM } from "../../config/Config";
import Vector from "../../helpers-common/helpers/Vector";
import { Rect } from "../../helpers-common/helpers/Rect";

export interface IEditorRenderParams {
    hovered_objects : ITile[]
    selected_object : ITile
    x_ray : boolean
}

export class ClientWorld extends World<ClientPlayer> {
    public particle_system : ParticleSystem = new ParticleSystem();

    constructor(loader : MapLoader, public app : CanvasApplicationInterface) {
        super(loader);
    }

    replicate_new_beam() {}
    replicate_player_added() {}
    replicate_player_removed() {}

    update(e : IUpdate) {
        super.update(e);
        this.particle_system.update(e);
    }

    render_particles() {
        this.particle_system.render();
    }

    render_beams() {
        this.beams.forEach(beam => {
            this.app.draw(ctx => {
                ctx.strokeStyle = beam.color;
                if (!beam.is_from_other) {
                    ctx.shadowColor = beam.color;
                    ctx.shadowBlur = 10;
                }

                ctx.beginPath();
                ctx.lineWidth = beam.size;
                beam.path.forEach((seg, i) => {
                    if (i === 0) {
                        ctx.moveTo(seg.getX(), seg.getY());
                    } else {
                        ctx.lineTo(seg.getX(), seg.getY());
                    }
                });

                ctx.stroke();
            });
        })
    }

    fix_tile_indices() {
        this.tiles.forEach((tile, i) => {tile.absolute_tile_index = i});
    }

    render_world(vision_rect : Rect, dec_rendering_vis_group : string, singular_dec_norender_index : number, editor_rendering_params : IEditorRenderParams) {
        this.map_chunker.get_tiles_in_rect(vision_rect).sort((a, b) => a.absolute_tile_index - b.absolute_tile_index).forEach(tile => {
            this.app.draw((ctx) => {
                ctx.imageSmoothingEnabled = false;
                if (tile.layer === Layers.obj || tile.force_original_color) {
                    ctx.fillStyle = tile.color;
                } else {
                    ctx.fillStyle = rainbow_color({
                        time_div: 20, saturation: 10, light: 20
                    });
                }

                if (tile.bullet_phased) ctx.globalAlpha = 0.75;

                if (editor_rendering_params !== null && editor_rendering_params.x_ray) {
                    ctx.globalAlpha -= 0.5;
                }

                if (tile.visgroup === dec_rendering_vis_group || tile.absolute_tile_index === singular_dec_norender_index) {
                    ctx.globalAlpha = 0.6;
                }

                if (editor_rendering_params !== null && editor_rendering_params.selected_object !== tile && editor_rendering_params.hovered_objects.find(hovered_tile => hovered_tile === tile)) {
                    ctx.fillStyle = "red";   
                }

                tile.rect.fill_rect_pixelfixed(ctx);
            });

            if (typeof tile.one_way === "number") {
                this.app.draw(ctx => {
                    const tile_center = tile.rect.point_middle();

                    const axis = tile.one_way === OneWayDirections.negative_x || tile.one_way === OneWayDirections.positive_x ? Axis.X : Axis.Y;
                    const positive = tile.one_way === OneWayDirections.positive_x || tile.one_way === OneWayDirections.positive_y;

                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 10;
                    ctx.setLineDash([5, 5]);
                    ctx.translate(Math.floor(tile_center.getX()), Math.floor(tile_center.getY()));
                    ctx.scale(0.5, 0.5);

                    if (axis === Axis.Y) {
                        ctx.beginPath();
                        ctx.moveTo(-tile.w / 2, ((tile.h / 2) * (positive ? -1 : 1)));
                        ctx.lineTo(0, 0);
                        ctx.lineTo(tile.w / 2, ((tile.h / 2) * (positive ? -1 : 1)));
                      } else {
                        ctx.beginPath();
                        ctx.moveTo(((tile.w / 2) * (positive ? -1 : 1)), -tile.h / 2);
                        ctx.lineTo(0, 0);
                        ctx.lineTo(((tile.w / 2) * (positive ? -1 : 1)), tile.h / 2);
                      }

                      ctx.stroke();
                      ctx.closePath();
                });
            }
        });
    }

    render_bounding_box() {
        this.app.draw(ctx => {
            ctx.strokeStyle = "#ff2828";
            ctx.lineWidth = 10;
            Rect.from_positions(new Vector(TPZONE_LEFT, TPZONE_TOP), new Vector(TPZONE_RIGHT, TPZONE_BOTTOM)).stroke_rect(ctx);
        });
    }
}