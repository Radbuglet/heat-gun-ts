import { CanvasSubApplication, CanvasApplication } from "../../helpers-client/CanvasApplication";
import { ClientPlayer } from "./ClientPlayer";
import { Camera } from "../../helpers-client/Camera";
import Vector from "../../helpers-common/helpers/Vector";
import { ClientWorld } from "./ClientWorld";
import { WeaponStatsMenu } from "./WeaponStatsMenu";
import { MapLoader, Layers } from "../../config/MapLoader";
import { calculate_ticks, torad } from "../../helpers-common/helpers/Math";
import { ExecMode } from "../../helpers-common/helpers/RunPlatform";
import { render_tablist } from "./TablistController";
import { RushDirections } from "../../helpers-common/RushDirections";
import { Rect } from "../../helpers-common/helpers/Rect";
import { rainbow_color } from "../../helpers-client/color";
import { WEAPONS_HELD, MAX_HEALTH, TPZONE_LEFT, TPZONE_TOP, TPZONE_RIGHT, TPZONE_BOTTOM } from "../../config/Config";
import { ITextComponent } from "../../helpers-common/helpers/ITextComponent";
import { draw_text, limit_line_size } from "../../helpers-client/draw_text";

export abstract class GameWorld extends CanvasSubApplication {
    public local_player : ClientPlayer;
    private camera : Camera = new Camera(new Vector(0, 0));
    public world : ClientWorld;
    private weapon_stats_menu;
    private chat_log : ITextComponent[][] = [];

    private total_ticks = 0;
    private total_ms = 0;
    protected ping : number = 0;
    private direction_negate_mode : boolean = false;

    constructor(main_app : CanvasApplication, maploader : MapLoader, my_uuid : string, my_name : string, my_spawn : Vector) {
        super(main_app);

        this.weapon_stats_menu = new WeaponStatsMenu(this, this.handle_stats_change.bind(this));
        
        this.world = new ClientWorld(maploader, this);
        this.local_player = new ClientPlayer(this.world, my_name);
        this.local_player.uuid = my_uuid;
        this.local_player.position.copyOther(my_spawn);
        this.world.add_player(this.local_player);
    }

    add_message(msg : ITextComponent[]) {
        this.chat_log.push(msg);

        if (this.chat_log.length >= 20) {
            this.chat_log.shift();
        }
    }
    
    app_update(delta) {
        const ticks = calculate_ticks(delta);
        this.total_ms += delta;
        this.total_ticks = ticks;

        const event = {
            delta, ticks, exec_mode: ExecMode.client, total_ms: this.total_ms, total_ticks: this.total_ticks
        }

        this.local_player.gun_look_direction = this.get_mouse_position().sub(new Vector(this.getWidth() / 2, this.getHeight() / 2)).normalized();

        if (this.direction_negate_mode) this.local_player.gun_look_direction.mutnegate();
        this.world.update(event);

        if (!this.weapon_stats_menu.changing_weapon_stats) {
            const weapon = this.local_player.get_active_weapon();
            if (weapon.can_shoot() && this.is_mouse_down()) {
                this.handle_shot(this.local_player.gun_look_direction);
                weapon.shoot(this.local_player.gun_look_direction);
            }
        }
    }

    abstract handle_shot(lookdir : Vector);
    abstract handle_scope(new_state : boolean);
    abstract handle_stats_change(weapon_index : number, stat_index : number, is_upgrade : boolean);
    abstract handle_dash(direction : RushDirections);

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number) {
        this.draw(() => {
            this.camera.lookvec = this.local_player.position.add(this.local_player.get_active_weapon().get_teleportation_vec(this.local_player.gun_look_direction));
            this.camera.setZoom(
                (
                    this.camera.getZoom() +
                    1 - this.local_player.get_active_weapon().get_upgrades().scope * 0.08
                ) / 2
            );

            this.camera.attach(ctx, width, height);

            let visgroup = "";
            let collided_dec_tile_index = null;
            this.local_player.get_movement_collisions(new Vector(0, 0), true).forEach(tile => {
                if (tile.layer === Layers.dec) collided_dec_tile_index = tile.absolute_tile_index;
                if (typeof tile.visgroup === "string") visgroup = tile.visgroup;
            });

            this.world.render_beams();
            this.world.render_particles();

            this.world.players.forEach(player => player.render(this));
            this.draw(() => {
                if (this.local_player.using_scope) {
                    this.draw(() => {
                        const raycaster = this.local_player.get_active_weapon().raycast_beam(this.local_player.gun_look_direction, 10);

                        ctx.beginPath();
                        raycaster.beam_path.forEach((pos, i) => {
                            if (i === 0) {
                                ctx.moveTo(pos.getX(), pos.getY());
                            } else {
                                ctx.lineTo(pos.getX(), pos.getY());
                            }
                        });

                        ctx.globalAlpha = raycaster.collided_player ? 0.4 : 0.1;
                        ctx.lineWidth = this.local_player.get_active_weapon().get_bullet_size();
                        ctx.fillStyle = this.local_player.get_active_weapon().get_beam_color();
                        ctx.stroke();
                    });
                }
            });

            this.world.render_world(visgroup, collided_dec_tile_index);

            this.draw(() => {
                const active_weapon = this.local_player.get_active_weapon();

                if (active_weapon.get_upgrades().teleportation > 0) {
                    this.draw(() => {
                        ctx.strokeStyle = "red";
                        this.local_player.collision_rect.clone_and_perform(rect => {
                            rect.top_left.mutadd(active_weapon.get_teleportation_vec(this.local_player.gun_look_direction));
                        }).stroke_rect(ctx);
                    });
                }
            });

            // Draw world bounding box
            this.draw(() => {
                ctx.strokeStyle = "#ff2828";
                ctx.lineWidth = 10;
                //ctx.setLineDash([10, 2]);
                Rect.from_positions(new Vector(TPZONE_LEFT, TPZONE_TOP), new Vector(TPZONE_RIGHT, TPZONE_BOTTOM)).stroke_rect(ctx);
            });

            this.camera.dettach(ctx);
        });

        // Draw localizers
        this.draw_localizer(LocalizerSides.left);
        this.draw_localizer(LocalizerSides.right);

        this.draw(() => { // HUD
            const screen_rect = new Rect(new Vector(0, 0), new Vector(width, height));
            this.draw(() => { // Bottom part
                const weaponbar_rect = Rect.from_positions(new Vector(0, height - 50), new Vector(width, height));
                const container_rect = weaponbar_rect.get_percent_margin_rect(0.1);
                
                // Draw bar
                this.draw(() => {
                    this.draw(() => { // Cool looking effect with moving things that creep people out
                        ctx.fillStyle = rainbow_color({
                            light: 50, saturation: 20, time_div: 20
                        });

                        const bar_rect = Rect.from_positions(weaponbar_rect.point_top_left().sub(new Vector(0, 4)), weaponbar_rect.point_top_right());
                        const number_of_thingies = 50;

                        const drawing_rect = bar_rect.clone();
                        drawing_rect.size.mutmult(new Vector(1 / number_of_thingies, 1));

                        for (let x = 0; x < number_of_thingies; x++) {
                            Rect.from_positions(drawing_rect.point_top_left().mutadd(new Vector(0,
                                Math.sin(torad(
                                    (x / number_of_thingies) * 360 + Date.now()
                                )) * 1 - Math.floor(Math.random() * 2)
                            )), drawing_rect.point_bottom_right()).fill_rect(ctx);

                            drawing_rect.top_left.mutadd(drawing_rect.size.isolate_x());
                        }
                    });

                    this.draw(() => {
                        ctx.fillStyle = "#1e1e1e";
                        ctx.globalAlpha = 0.9;
                        weaponbar_rect.fill_rect(ctx);
                    });
                });

                // Wierd thingies
                this.draw(() => {
                    ctx.rect(weaponbar_rect.get_x(), weaponbar_rect.get_y(), weaponbar_rect.get_width(), weaponbar_rect.get_height());
                    ctx.clip();
                    ctx.globalAlpha = 0.3;

                    const rectangle_thing = Rect.from_positions(
                        weaponbar_rect.point_bottom_right().sub(new Vector(  /*weaponbar_rect.get_height()*/ weaponbar_rect.get_width() * 0.2  )),
                        weaponbar_rect.point_bottom_right()
                    );
                    
                    for (let s = 0; s < rectangle_thing.get_width(); s += 10) {
                        ctx.strokeStyle = `hsl(${Date.now() / 20 + s}, 50%, 70%)`;
                        ctx.beginPath();
                        //ctx.setLineDash([2, 2])
                        ctx.moveTo(
                            rectangle_thing.get_x() + rectangle_thing.get_width(),
                            rectangle_thing.get_y() + s
                        );
                        ctx.lineTo(
                            rectangle_thing.get_x() + rectangle_thing.get_width() - s,
                            rectangle_thing.get_y() + rectangle_thing.get_height()
                        );
                        ctx.stroke();
                    }
                });

                // Weapon list
                this.draw(() => {
                    const split_container_rect = container_rect.clone_and_perform(rect => {
                        rect.size.mutdiv(new Vector(this.local_player.weapons.length, 1));
                    });

                    this.local_player.weapons.forEach((weapon, i) => {
                        const this_weapon_rect = split_container_rect.clone_and_perform(rect => {
                            rect.top_left.mutsub(new Vector(0, i === this.local_player.get_selected_slot() ? 7 : 0));
                        });

                        ctx.fillStyle = weapon.theme_color;
                        ctx.shadowBlur = 5;
                        ctx.shadowColor = weapon.theme_color;
                        
                        ctx.font = (this_weapon_rect.get_height() / 2) + "px monospace";
                        ctx.textBaseline = "top";
                        ctx.fillText("Weapon " + (i + 1).toString() + "  " + "⁍".repeat(weapon.get_ammo()), this_weapon_rect.get_x(), this_weapon_rect.get_y());


                        const total_bar_rect = Rect.from_positions(this_weapon_rect.get_point(0, 0.5), this_weapon_rect.get_point(1, 1));
                        total_bar_rect.top_left.mutadd(new Vector(0, 4));
                        total_bar_rect.size.mutsub(new Vector(4, 0));

                        this.draw(() => {
                            ctx.shadowColor = "#000";
                            ctx.fillStyle = "#000";
                            total_bar_rect.fill_rect(ctx);
                        });


                        if (weapon.get_pullup_cooldown() > 0 && weapon.is_selected()) {
                            this.draw(() => {
                                ctx.shadowColor = "red";
                                ctx.fillStyle = "red";
                                total_bar_rect.clone_and_perform(rect => {
                                    rect.size.mutmult(new Vector(weapon.get_pullup_cooldown() / weapon.get_pullup_cooldown_max(), 1));
                                }).fill_rect(ctx);
                            });
                        } else {
                            total_bar_rect.clone_and_perform(rect => {
                                rect.size.mutmult(new Vector(1 - (weapon.shot_cooldown / weapon.get_cooldown_when_shooting()), 1));
                            }).fill_rect(ctx);
                        }

                        split_container_rect.top_left.mutadd(split_container_rect.size.isolate_x());
                    });
                });

                // HP Bar
                const container_hpbar_rect = Rect.centered_around(weaponbar_rect.get_point(0.5, 0).sub(new Vector(0, 50)), new Vector(width * 0.3 + 150, 40));
                
                this.draw(() => {
                    const hpbar_rect = container_hpbar_rect.clone_and_perform(rect => rect.size.mutsub(new Vector(170, 0)));
                    const hptext_rect = Rect.from_positions(hpbar_rect.point_top_right().add(new Vector(20, -5)), hpbar_rect.point_bottom_right().add(new Vector(170, 5)));

                    this.draw(() => {
                        const sectioned_hpbar_rect = hpbar_rect.clone_and_perform(rect => {
                            rect.top_left.mutfloor();
                            rect.size.mutdiv(new Vector(MAX_HEALTH, 1));
                            rect.size.mutfloor();
                        });

                        for (let x = 1; x <= MAX_HEALTH; x++) {
                            const cloned_sectioned_hpbar_rect = sectioned_hpbar_rect.clone_and_perform(rect => {
                                rect.top_left.mutadd(new Vector(0, 
                                    4 * Math.sin(torad(x * 5 + Date.now() / 5))
                                ));
                            })
                            ctx.fillStyle = x <= this.local_player.health ? rainbow_color({
                                time_div: 20, light: 50, saturation: 100, add_to_time: x * 4
                            }) : "#2b2b2b";
                            cloned_sectioned_hpbar_rect.fill_rect(ctx);
    
                            ctx.fillStyle = x <= this.local_player.health ? rainbow_color({
                                time_div: 20, light: 30, saturation: 100, add_to_time: x * 4
                            }) : "#191919";
                            Rect.from_positions(cloned_sectioned_hpbar_rect.point_bottom_left(), cloned_sectioned_hpbar_rect.point_bottom_right().sub(new Vector(0, 10))).fill_rect(ctx);
    
                            sectioned_hpbar_rect.top_left.mutadd(sectioned_hpbar_rect.size.isolate_x());
                        }
                    });

                    this.draw(() => {
                        this.draw(() => {
                            ctx.fillStyle = "#333";
                            ctx.globalAlpha = 0.9;
                            hptext_rect.fill_rect(ctx);
                        });

                        ctx.fillStyle = "#efefef";
                        ctx.textBaseline = "middle";
                        ctx.textAlign = "center";
                        ctx.font = "20px monospace";
                        ctx.fillText("HP " + this.local_player.health + "/" + MAX_HEALTH, hptext_rect.point_middle().getX(), hptext_rect.point_middle().getY());
                    });
                });

                // Chat
                const chat_start_x = 50;
                const chat_lines = limit_line_size(this, "15px monospace", this.chat_log, (container_hpbar_rect.get_x() - 30) - chat_start_x);
                draw_text(this, chat_start_x, weaponbar_rect.get_y() - 30 - (chat_lines.length * 17), "15px monospace", 17, chat_lines); 
            });

            this.draw(() => {
                ctx.fillStyle = "#008f32";

                ctx.font = "20px monospace";
                ctx.textBaseline = "top";
                ctx.textAlign = "center";
                ctx.fillText("Press F to upgrade your weapon, Tab to view tablist", width / 2, height - 200);
                ctx.fillText("Energy: " + this.local_player.energy + " | Score: " + this.local_player.total_energy, width / 2, height - 170);
            });
        });

        if (this.get_keys_down().get("Tab") && !this.weapon_stats_menu.changing_weapon_stats) {
            render_tablist(this, this.ping);
        }

        // Weapon stats UI
        this.weapon_stats_menu.render();
    }

    draw_localizer(side : LocalizerSides) {
        this.draw(ctx => {
            const x_level = side === LocalizerSides.left ? 0 : this.getWidth() - 0;
            ctx.strokeStyle = rainbow_color({ time_div: 20, saturation: 20, light: 40 });
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x_level, 0);
            for (let y = 0; y < this.getHeight(); y += 20) {
                let magnitude = 3;
                this.world.players.forEach(player => {
                    if (player !== this.local_player && side === LocalizerSides.left ? player.position.getX() < this.local_player.position.getX() : player.position.getX() > this.local_player.position.getX()) {
                        const player_dist = Math.abs(player.position.getX() - this.local_player.position.getX());
                        const axis_dist = Math.abs(player.position.getY() - this.camera.toWorldPos(new Vector(x_level, y), this.getWidth(), this.getHeight()).getY());

                        magnitude += Math.max(
                            (-Math.pow(axis_dist / 100, 2) + 40) + (-Math.pow(player_dist / 400, 2) + 50),
                            0);
                    }
                });

                ctx.lineTo(
                    side === LocalizerSides.left ?
                        x_level + Math.random() * magnitude * (this.local_player.using_scope ? 1 : 0.3) :
                        x_level - Math.random() * magnitude * (this.local_player.using_scope ? 1 : 0.3),
                y);
            }

            ctx.stroke();
        });
    }

    app_keydown(e : KeyboardEvent) {
        if (!this.weapon_stats_menu.changing_weapon_stats) {
            if (this.local_player.can_use_rush) {
                if (e.code === "KeyW") {
                    this.local_player.rush(RushDirections.UP);
                    this.handle_dash(RushDirections.UP);
                }
    
                if (e.code === "KeyS") {
                    this.local_player.rush(RushDirections.DOWN);
                    this.handle_dash(RushDirections.DOWN);
                }
    
                if (e.code === "KeyA") {
                    this.local_player.rush(RushDirections.LEFT);
                    this.handle_dash(RushDirections.LEFT);
                }
    
                if (e.code === "KeyD") {
                    this.local_player.rush(RushDirections.RIGHT);
                    this.handle_dash(RushDirections.RIGHT);
                }
            }
    
            if (e.code === "Space" && !this.local_player.using_scope) {
                this.local_player.using_scope = true;   
                this.handle_scope(true);
            }
        }

        if (e.code === "Digit1") this.local_player.select_slot(0);
        if (e.code === "Digit2") this.local_player.select_slot(1);
        if (e.code === "Digit3") this.local_player.select_slot(2);

        if (e.code === "KeyR") this.direction_negate_mode = !this.direction_negate_mode;

        if (e.code === "Tab") {
            e.preventDefault();
        }

        this.weapon_stats_menu.keydown(e);
    }

    app_keyup(e : KeyboardEvent) {
        if (e.code === "Space" && this.local_player.using_scope) {
            this.local_player.using_scope = false;
            this.handle_scope(false);
        }
    }

    app_mousedown(e : MouseEvent) {
        if (e.button === 2) this.direction_negate_mode = true;
    }

    app_mouseup(e : MouseEvent) {
        if (e.button === 2) this.direction_negate_mode = false;
    }
}

enum LocalizerSides {
    left, right
}