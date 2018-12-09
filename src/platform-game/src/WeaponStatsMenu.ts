// @TODO make helper methods and store references, it doesn't hurt!

import { rainbow_color } from "../../helpers-client/color";
import { configurable_traits, ITrait } from "../../helpers-common/Weapon";
import { Rect } from "../../helpers-common/helpers/Rect";
import Vector from "../../helpers-common/helpers/Vector";
import { GameWorld } from "./GameWorld";

export class WeaponStatsMenu {
    public changing_weapon_stats : boolean = false;
    public weapon_stat_edit_index : number = 0;
    constructor(private app : GameWorld, private stat_changed_handler : (weapon_index : number, stat_index : number, is_upgrade : boolean) => void) {

    }

    get_selected_trait() : ITrait {
        return configurable_traits[this.weapon_stat_edit_index];
    }

    render() {
        if (!this.changing_weapon_stats) return;

        const width = this.app.getWidth();
        const height = this.app.getHeight();
        this.app.draw(ctx => {
            this.app.draw(() => {
                ctx.fillStyle = "#000";
                ctx.globalAlpha = 0.6;
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = rainbow_color({ light: 3, saturation: 100, time_div: 20 });
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.moveTo(0, height * 0.9);
                ctx.lineTo(0, height);
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fill();
            });

            this.app.draw(() => {
                const page_begin_x = width * 0.1;
                const page_begin_y = height * 0.1;

                const page_width = width * 0.8;

                let active_element_y = page_begin_y;

                this.app.draw(() => {
                    const weapon_width = page_width / 3;
                    const weapon_height = 50;

                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    ctx.fillStyle = "#fff";
                    ctx.font = "30px monospace";

                    ctx.fillText(this.app.local_player.energy + " energy", page_begin_x + page_width / 2, active_element_y);

                    active_element_y += 50;
                    
                    this.app.local_player.weapons.forEach((weapon, i) => {
                        const weapon_rect = new Rect(new Vector(page_begin_x + weapon_width * i, active_element_y), new Vector(weapon_width, weapon_height));

                        this.app.draw(() => {
                            ctx.fillStyle = rainbow_color({ light: i === this.app.local_player.selected_slot ? 70 : 20, saturation: i === this.app.local_player.selected_slot ? 100 : 10, time_div: 20 });
                            ctx.fillRect(weapon_rect.get_x(), weapon_rect.get_y(), weapon_rect.get_width(), weapon_rect.get_height());

                            ctx.strokeStyle = rainbow_color({ light: 10, saturation: 20, time_div: 20 });
                            ctx.strokeRect(weapon_rect.get_x(), weapon_rect.get_y(), weapon_rect.get_width(), weapon_rect.get_height());
                        });

                        ctx.fillText("Weapon " + (i + 1), weapon_rect.point_middle().getX(), weapon_rect.point_middle().getY());
                        ctx.strokeText("Weapon " + (i + 1), weapon_rect.point_middle().getX(), weapon_rect.point_middle().getY());
                    });

                    active_element_y += weapon_height + 40;
                });

                this.app.draw(() => {
                    const trait_elem_height = 75;
                    const trait_elem_x = width * 0.3;
                    const trait_elem_width = width * (1 - (0.3 * 2));

                    configurable_traits.forEach((trait_data, i) => {
                        if (Math.abs(i - this.weapon_stat_edit_index) < 3 || i > this.weapon_stat_edit_index) {
                            if (trait_data !== null) {
                                const is_selected = i === this.weapon_stat_edit_index;

                                ctx.fillStyle = is_selected ? "#5e5e5e" : "#3f3d3fdd";
                                ctx.strokeStyle = this.app.local_player.energy >= trait_data.cost ? "#e8e8e8" : "red";

                                ctx.shadowBlur = 20;
                                ctx.shadowColor = "#000";

                                ctx.fillRect(trait_elem_x, active_element_y, trait_elem_width, trait_elem_height);
                                ctx.strokeRect(trait_elem_x, active_element_y, trait_elem_width, trait_elem_height);

                                ctx.fillStyle = "#fff";
                                ctx.font = "20px monospace";
                                ctx.textAlign = "left";
                                ctx.textBaseline = "top";
                                ctx.fillText(trait_data.name, trait_elem_x + 10, active_element_y + 10);

                                ctx.fillStyle = "#f41f1f";
                                ctx.textAlign = "right";
                                ctx.shadowBlur = 0;
                                ctx.fillText(trait_data.cost + " energy per upgrade", trait_elem_x + trait_elem_width - 10, active_element_y + 10);

                                ctx.shadowBlur = 20;
                                ctx.shadowColor = "red";
                                ctx.textAlign = "left";
                                ctx.textBaseline = "bottom";

                                ctx.fillText(("[x] ".repeat(
                                    this.app.local_player.get_active_weapon().get_trait_value(trait_data)
                                )) + ("[ ] ".repeat(
                                    trait_data.maxval - this.app.local_player.get_active_weapon().get_trait_value(trait_data)
                                )), trait_elem_x + 10, active_element_y + trait_elem_height - 10);
                            }

                            active_element_y += trait_elem_height + 40;
                        }
                    });
                });
            });

            // Scroll bar
            this.app.draw(() => {
                const scroll_rect = Rect.from_positions(new Vector(width - 10, 10), new Vector(width, height - 10));
                const unit_rect = scroll_rect.clone_and_perform(rect => {
                    rect.size.mutdiv(new Vector(1, configurable_traits.length));
                });
                
                configurable_traits.forEach((trait, i) => {
                    if (trait !== null) {
                        this.app.draw(() => {
                            ctx.fillStyle = "#313131";
    
                            if (i === this.weapon_stat_edit_index) {
                                ctx.fillStyle = "#BDBDBD";
                            }
    
                            if (Rect.from_positions(unit_rect.point_top_left().sub(new Vector(200, 0)), unit_rect.point_bottom_right()).testcollision(Rect.centered_around(this.app.get_mouse_position(), new Vector(1)))) {
                                ctx.fillStyle = "#fff";
    
                                if (this.app.is_mouse_down()) {
                                    this.weapon_stat_edit_index = i;
                                }
                            }
                            
                            unit_rect.fill_rect(ctx);
                        });   
                    }

                    unit_rect.top_left.mutadd(unit_rect.size.isolate_y());
                });
            });
        });
    }

    keydown(e : KeyboardEvent) {
        if (this.changing_weapon_stats) {
            if (e.code === "Escape") {
                this.changing_weapon_stats = false;
            }
    
            if (e.code === "ArrowUp") {
                this.weapon_stat_edit_index -= 1;

                while (configurable_traits[this.weapon_stat_edit_index] === null) {
                    this.weapon_stat_edit_index -= 1;
                }
            }
    
            if (e.code === "ArrowDown") {
                this.weapon_stat_edit_index += 1;
                while (configurable_traits[this.weapon_stat_edit_index] === null) {
                    this.weapon_stat_edit_index += 1;
                }
            }
    
            const last_stat_index = configurable_traits.length - 1;
    
            if (this.weapon_stat_edit_index > last_stat_index) {
                this.weapon_stat_edit_index = 0;
            }
    
            if (this.weapon_stat_edit_index < 0) {
                this.weapon_stat_edit_index = last_stat_index;
            }
    
            if (e.code === "ArrowLeft") {
                this.app.local_player.get_active_weapon().downgrade_trait(this.get_selected_trait());
                this.stat_changed_handler(this.app.local_player.selected_slot, this.weapon_stat_edit_index, false);
            }
    
            if (e.code === "ArrowRight") {
                this.app.local_player.get_active_weapon().upgrade_trait(this.get_selected_trait());
                this.stat_changed_handler(this.app.local_player.selected_slot, this.weapon_stat_edit_index, true);
            }
        }

        if (e.code === "KeyF") {
            this.changing_weapon_stats = !this.changing_weapon_stats;
        }
        
    }
}