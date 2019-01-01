// @TODO make helper methods and store references, it doesn't hurt!

import { rainbow_color } from "../../helpers-client/color";
import { configurable_traits, ITrait, trait_categories } from "../../helpers-common/Weapon";
import { Rect } from "../../helpers-common/helpers/Rect";
import Vector from "../../helpers-common/helpers/Vector";
import { GameClient } from "./GameClient";
import { draw_text } from "../../helpers-client/draw_text";
import { get_theme_rainbow, get_theme_dark, get_theme_red } from "../../helpers-client/ColorTheme";
import { ITextComponent } from "../../helpers-common/helpers/ITextComponent";

const DISPLAY_CATEGORY_TICKS = 20;

export class WeaponStatsMenu {
    public changing_weapon_stats : boolean = false;
    public weapon_stat_edit_index : number = 0;
    private my_configurable_traits : ITrait[] = [...configurable_traits];
    private active_filter_index : number = 0;
    private ticks_display_category : number = 0;

    constructor(private app : GameClient, private stat_changed_handler : (weapon_index : number, stat_index : number, is_upgrade : boolean) => void) {

    }

    apply_filter(filter_index : number) {
        this.weapon_stat_edit_index = 0;
        this.active_filter_index = filter_index;
        this.my_configurable_traits = [...configurable_traits].filter(trait => {
            if (filter_index === 0) return true;

            return trait_categories[filter_index].filter_identifier === trait.filter_id;
        });

        this.ticks_display_category = DISPLAY_CATEGORY_TICKS + 30;
    }

    get_selected_trait() : ITrait {
        return this.my_configurable_traits[this.weapon_stat_edit_index];
    }

    render() {
        if (!this.changing_weapon_stats) return;

        this.ticks_display_category--;

        const width = this.app.getResolutionWidth();
        const height = this.app.getResolutionHeight();
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
                const page_end_x = width * 0.9;
                const page_begin_y = height * 0.1;

                const page_width = page_end_x - page_begin_x;

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
                            ctx.fillStyle = rainbow_color({ light: i === this.app.local_player.get_selected_slot() ? 70 : 20, saturation: i === this.app.local_player.get_selected_slot() ? 100 : 10, time_div: 20 });
                            ctx.fillRect(weapon_rect.get_x(), weapon_rect.get_y(), weapon_rect.get_width(), weapon_rect.get_height());

                            ctx.strokeStyle = rainbow_color({ light: 10, saturation: 20, time_div: 20 });
                            ctx.strokeRect(weapon_rect.get_x(), weapon_rect.get_y(), weapon_rect.get_width(), weapon_rect.get_height());
                        });

                        ctx.fillText("Weapon " + (i + 1), weapon_rect.point_middle().getX(), weapon_rect.point_middle().getY());
                        ctx.strokeText("Weapon " + (i + 1), weapon_rect.point_middle().getX(), weapon_rect.point_middle().getY());
                    });

                    active_element_y += weapon_height + 40;
                });
                
                const active_element_y_afterweapondisplay = active_element_y;

                this.app.draw(() => {
                    const trait_elem_height = 75;
                    const trait_elem_x = page_begin_x;
                    const trait_elem_width = page_width * 0.7;

                    this.my_configurable_traits.forEach((trait_data, i) => {
                        if (Math.abs(i - this.weapon_stat_edit_index) < 3 || i > this.weapon_stat_edit_index) {
                            if (trait_data !== null) {
                                const is_selected = i === this.weapon_stat_edit_index;

                                ctx.fillStyle = is_selected ? "#5e5e5e" : "#3f3d3fdd";
                                ctx.strokeStyle = this.app.local_player.energy >= trait_data.cost ? (is_selected ? get_theme_rainbow() : "#e8e8e8") : get_theme_red();

                                ctx.shadowBlur = 20;
                                ctx.shadowColor = ctx.strokeStyle === get_theme_rainbow() ? get_theme_rainbow() : "#000";

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

                this.app.draw(() => {
                    const text_lines : ITextComponent[][] = [];

                    text_lines.push(...[
                        [
                            {
                                bg: get_theme_red(),
                                color: "#fff",
                                text: "  Current Weapon Upgrades  "
                            }
                        ],
                        []
                    ]);

                    if (this.app.local_player.get_active_weapon().get_active_upgrades().length === 0) {
                        text_lines.push(...[
                            [
                                {
                                    color: get_theme_red(),
                                    text: "No upgrades on this gun!"
                                }
                            ]
                        ]);
                    }

                    this.app.local_player.get_active_weapon().get_active_upgrades().forEach(trait_info => {
                        const trait_val = this.app.local_player.get_active_weapon().get_upgrades()[trait_info.key];
                        text_lines.push(...[
                            [
                                {
                                    bg: get_theme_rainbow(),
                                    color: get_theme_dark(),
                                    text: " " + trait_info.name + " "
                                }
                            ],
                            [
                                {
                                    bg: get_theme_dark(),
                                    color: get_theme_red(),
                                    text: " " + "[x] ".repeat(trait_val) + "[ ] ".repeat(trait_info.maxval - trait_val) + " "
                                }
                            ],
                            []
                        ]);
                    });

                    text_lines.push(...[
                        [],
                        [
                            {
                                bg: get_theme_red(),
                                color: "#fff",
                                text: "  Current Weapon Stats  "
                            }
                        ],
                        [],
                        [
                            {
                                bg: get_theme_dark(),
                                color: get_theme_red(),
                                text: " Damage per bullet: "
                            },
                            {
                                bg: get_theme_dark(),
                                color: get_theme_rainbow(),
                                text: this.app.local_player.get_active_weapon().get_damage() + " "
                            }
                        ],
                        [
                            {
                                bg: get_theme_dark(),
                                color: get_theme_red(),
                                text: " Range: "
                            },
                            {
                                bg: get_theme_dark(),
                                color: get_theme_rainbow(),
                                text: this.app.local_player.get_active_weapon().get_max_dist() + " "
                            }
                        ],
                        [
                            {
                                bg: get_theme_dark(),
                                color: get_theme_red(),
                                text: " Shoot cooldown: "
                            },
                            {
                                bg: get_theme_dark(),
                                color: get_theme_rainbow(),
                                text: this.app.local_player.get_active_weapon().get_cooldown_when_shooting() + " ticks "
                            }
                        ],
                        [
                            {
                                bg: get_theme_dark(),
                                color: get_theme_red(),
                                text: " Pull out cooldown: "
                            },
                            {
                                bg: get_theme_dark(),
                                color: get_theme_rainbow(),
                                text: this.app.local_player.get_active_weapon().get_pullup_cooldown_max() + " ticks "
                            }
                        ]
                    ]);

                    text_lines.push(...[
                        [],
                        [{
                            bg: get_theme_red(),
                            color: "#fff",
                            text: "  Filter Upgrades  "
                        }],
                        []
                    ]);

                    trait_categories.forEach((category, i) => {
                        text_lines.push([
                            {
                                bg: category.filter_identifier === trait_categories[this.active_filter_index].filter_identifier ? "#fff" : undefined,
                                color: get_theme_dark(),
                                text: "   "
                            },
                            {
                                bg: get_theme_dark(),
                                color: category.filter_identifier === trait_categories[this.active_filter_index].filter_identifier ? "#fff" : get_theme_red(),
                                text: " " + category.name + " ",
                                hover_bg: "#0d0d0d",
                                click_func_action: () => {
                                    this.apply_filter(i);
                                }
                            }
                        ]);
                    });

                    text_lines.push(...[
                        [],
                        [{
                            color: get_theme_red(),
                            text: " Pro Tip: Press Shift + Up/Down Arrow "
                        }],
                        [{
                            color: get_theme_red(),
                            text: " to change the selected category! "
                        }],
                        []
                    ]);

                    draw_text(this.app, page_begin_x + page_width * 0.7 + 20, active_element_y_afterweapondisplay, "20px monospace", 20, text_lines);
                });
            });

            this.app.draw(ctx => {
                const text = "← → - downgrade/upgrade    ↑ ↓ - previous/next upgrade";
                ctx.textAlign = "left";
                ctx.textBaseline = "bottom";
                ctx.font = "20px monospace";

                ctx.fillStyle = get_theme_red();
                Rect.from_positions(new Vector(20 - 5, height - 30 - 25), new Vector(20 + ctx.measureText(text).width + 5, height - 30 + 5)).fill_rect(ctx);

                ctx.fillStyle = "#fff";
                ctx.fillText(text, 20, height - 30);
            });

            if (this.ticks_display_category > 0 || this.app.get_keys_down().get("ShiftLeft")) {
                this.app.draw(() => {
                    ctx.globalAlpha = this.app.get_keys_down().get("ShiftLeft") ? 1 : this.ticks_display_category / DISPLAY_CATEGORY_TICKS;
                    draw_text(this.app, width / 2, height / 2, "30px monospace", 30, [
                        [{
                            bg: get_theme_rainbow(),
                            color: get_theme_dark(),
                            text: "  " + trait_categories[this.active_filter_index].name + "  "
                        }]
                    ], true);
                });
            }
        });
    }

    keydown(e : KeyboardEvent) {
        if (this.changing_weapon_stats) {
            if (e.code === "Escape") {
                this.changing_weapon_stats = false;
            }
            
            if (!this.app.get_keys_down().get("ShiftLeft")) {
                if (e.code === "ArrowUp" && this.weapon_stat_edit_index > 0) {
                    this.weapon_stat_edit_index -= 1;
                }
        
                if (e.code === "ArrowDown" && this.weapon_stat_edit_index < this.my_configurable_traits.length - 1) {
                    this.weapon_stat_edit_index += 1;
                }
            } else {
                if (e.code === "ArrowUp" && this.active_filter_index > 0) {
                    this.active_filter_index -= 1;
                    this.apply_filter(this.active_filter_index);
                }
        
                if (e.code === "ArrowDown" && this.active_filter_index < trait_categories.length - 1) {
                    this.active_filter_index += 1;
                    this.apply_filter(this.active_filter_index);
                }
            }
    
            if (e.code === "ArrowLeft") {
                this.app.local_player.get_active_weapon().downgrade_trait(this.get_selected_trait());
                this.stat_changed_handler(this.app.local_player.get_selected_slot(), this.get_selected_trait().unfiltered_index, false);
            }
    
            if (e.code === "ArrowRight") {
                this.app.local_player.get_active_weapon().upgrade_trait(this.get_selected_trait());
                this.stat_changed_handler(this.app.local_player.get_selected_slot(), this.get_selected_trait().unfiltered_index, true);
            }
        }

        if (e.code === "KeyF") {
            this.changing_weapon_stats = !this.changing_weapon_stats;
        }        
    }
}