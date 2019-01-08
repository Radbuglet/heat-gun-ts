import { CanvasSubApplication } from "../../../helpers-client/CanvasApplication";
import { rainbow_color } from "../../../helpers-client/color";
import { Rect } from "../../../helpers-common/helpers/Rect";
import Vector from "../../../helpers-common/helpers/Vector";
import { torad } from "../../../helpers-common/helpers/Math";
import { MainGame } from "../entry";
import { Player } from "../../../helpers-common/Player";
import { ILbDBScore } from "../../../helpers-common/LeaderboardScheme";
import { LeaderboardLoader } from "../LeaderboardLoader";
import { ITextComponent } from "../../../helpers-common/helpers/ITextComponent";
import { draw_text, AlignmentModes } from "../../../helpers-client/draw_text";
import { MapLoader } from "../../../helpers-common/MapLoader";
import { MenuBGSub } from "./MenuBGSub";
import { get_theme_rainbow, get_theme_dark, get_theme_red } from "../../../helpers-client/ColorTheme";
import { discord_invite_url, github_repo_url } from "../../../config/Config";
import { TestWorldClient } from "../TestWorldClient";

export class MainMenuSub extends MenuBGSub {
    private active_leaderboard_index : number = 0;

    constructor(private main_app : MainGame, map_loader : MapLoader, private leaderboard_loader : LeaderboardLoader, private death_message : ITextComponent[] = null) {
        super(main_app, map_loader);
    }

    app_keydown(e : KeyboardEvent) {
        if (!this.main_app.has_authenticated()) return;
        if (e.code === "Space") {
            const name = prompt("Name", localStorage.getItem("last_name") || "");

            if (name) {
                const username_error = Player.is_valid_username(name);

                if (typeof username_error === "string") {
                    alert("Invalid username!\n\n" + username_error);
                    return;
                }

                localStorage.setItem("last_name", name);
                this.main_app.request_spawn_player(name);
            }
        }

        if (e.code === "Enter") {
            if (localStorage.getItem("last_name")) {
                this.main_app.request_spawn_player(localStorage.getItem("last_name"));
            }
        }

        if (this.leaderboard_loader.has_loaded()) {
            if (e.code === "ArrowLeft") {
                this.active_leaderboard_index--;
            }
    
            if (e.code === "ArrowRight") {
                this.active_leaderboard_index++;
            }
    
            if (this.active_leaderboard_index < 0) this.active_leaderboard_index = this.leaderboard_loader.data.categories.length - 1;
            if (this.active_leaderboard_index >= this.leaderboard_loader.data.categories.length) this.active_leaderboard_index = 0;
        }
    }

    app_keyup(e) {
        
    }

    app_mousedown(e) {
        
    }

    app_mouseup(e) {
        
    }

    app_update(dt : number, ticks_passed : number) {
        super.app_update(dt, ticks_passed);
    }

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number) {
        const screen_rect = new Rect(new Vector(0, 0), new Vector(width, height));

        // Bg
        super.app_render(ctx, width, height, ticks_passed);

        // Logo
        let logo_rect : Rect;
        let space_to_play_start_y : number;
        
        this.draw(() => {
            const logo_text = "Heat Gun";
            const logo_font_size = 120;

            ctx.fillStyle = "gold";
            ctx.strokeStyle = "#ff0a12";
            ctx.shadowColor = "#ff0a12";
            ctx.shadowBlur = 5;
            ctx.lineWidth = 1;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            //ctx.globalAlpha = 0.6;
            ctx.font = logo_font_size + "px 'Bangers'";

            const logo_width = ctx.measureText(logo_text).width;
            logo_rect = new Rect(
                screen_rect.get_point(0.5, 0.1).sub(new Vector(logo_width / 2, -logo_font_size / 2)),
                new Vector(logo_width, logo_font_size)
            );
            
            let draw_x = logo_rect.get_x();
            logo_text.split('').forEach(char => {
                ctx.fillText(char, draw_x, logo_rect.point_middle().getY() + Math.sin(torad(draw_x + Date.now())) * 5);
                ctx.strokeText(char, draw_x, logo_rect.point_middle().getY() + Math.sin(torad(draw_x + Date.now())) * 5);
                draw_x += ctx.measureText(char).width;
            });
        });

        // Space to play text
        this.draw(() => {
            space_to_play_start_y = screen_rect.get_point(0.5, 0.8).getY() - 40;

            ctx.font = "40px 'Bangers'";
            ctx.fillStyle = rainbow_color({
                light: 50,
                saturation: 80,
                time_div: 20
            });
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Press space to play", screen_rect.get_point(0.5, 0.8).getX(), screen_rect.get_point(0.5, 0.8).getY());

            ctx.fillStyle = rainbow_color({
                light: 40,
                saturation: 80,
                time_div: 20
            });
            ctx.font = "20px 'Bangers'";
            ctx.fillText("Pro tip: Press enter to play with last name", screen_rect.get_point(0.5, 0.9).getX(), screen_rect.get_point(0.5, 0.9).getY());
        });

        // Leaderboard
        if (this.leaderboard_loader.has_loaded()) {
            this.draw(() => {
                const lb_main_rect_1d = Rect.from_positions(
                    logo_rect.get_point(0.5, 1).add(new Vector(0, 20)),
                    new Vector(screen_rect.point_middle().getX(), space_to_play_start_y - 20)
                );
    
                const lb_main_rect = Rect.centered_around(
                    lb_main_rect_1d.point_middle(),
                    new Vector(screen_rect.get_width() * 0.25, lb_main_rect_1d.get_height())
                );
    
                // Draw contents
                this.draw(() => {
                    let active_draw_location = lb_main_rect.get_point(0.5, 0).add(new Vector(0, 20));
    
                    // Category title
                    this.draw(() => {
                        ctx.fillStyle = "#ff0073";
                        ctx.strokeStyle = "#c7005a";
                        ctx.shadowColor = "#c7005a";
                        ctx.shadowBlur = 5;
                        ctx.lineWidth = 1;
        
                        ctx.font = "30px 'Bangers'";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";

                        const text_str = "[⇠] " + this.leaderboard_loader.data.categories[this.active_leaderboard_index].name + " [⇢]";
                        ctx.strokeText(text_str, active_draw_location.getX(), active_draw_location.getY());
                        ctx.fillText(text_str, active_draw_location.getX(), active_draw_location.getY());
        
                        active_draw_location.mutadd(new Vector(0, 24));
                    });
    
                    // Entries
                    this.draw(() => {
                        const scores : ILbDBScore[] = this.leaderboard_loader.data.categories[this.active_leaderboard_index].scores;
                        const number_of_columns = 2;
                        const full_space_rect = Rect.from_positions(new Vector(lb_main_rect.get_x(), active_draw_location.getY() + 4), lb_main_rect.point_bottom_right());
                        const smaller_rect = full_space_rect.clone_and_perform(rect => {
                            rect.size.setY(30);
                            rect.size.mutmult(new Vector(1 / number_of_columns, 1));
                            rect.size.mutsub(new Vector(2, 0));
                            rect.top_left.mutadd(new Vector(1, 0));
                        });
    
                        let current_column = 1;
    
                        scores.forEach((score : ILbDBScore, i : number) => {
                            this.draw(() => {
                                ctx.fillStyle = rainbow_color({
                                    add_to_time: i * 10,
                                    light: 20,
                                    saturation: 50,
                                    time_div: 20
                                });
                                ctx.globalAlpha = 0.7;
                                smaller_rect.fill_rect(ctx);
                            });
    
                            this.draw(() => {
                                ctx.fillStyle = rainbow_color({
                                    add_to_time: i * 10,
                                    light: 80,
                                    saturation: 50,
                                    time_div: 20
                                });
                                ctx.font = "15px monospace";
                                ctx.textAlign = "left";
                                ctx.textBaseline = "middle";
                                ctx.fillText((i + 1) + " - " + score.username, smaller_rect.get_margin_rect(4).get_point(0, 0.5).getX(), smaller_rect.get_margin_rect(4).get_point(0, 0.5).getY());
                                
                                ctx.fillStyle = rainbow_color({
                                    add_to_time: i * 10,
                                    light: 90,
                                    saturation: 100,
                                    time_div: 20
                                });
                                ctx.textAlign = "right";
                                ctx.shadowBlur = 5;
                                ctx.shadowColor = ctx.fillStyle;
                                ctx.fillText(score.score.toString(), smaller_rect.get_margin_rect(4).get_point(1, 0.5).getX() - 4, smaller_rect.get_margin_rect(4).get_point(1, 0.5).getY());
                            });
    
                            smaller_rect.top_left.mutadd(smaller_rect.size.isolate_x().add(new Vector(2, 0)));
                            current_column += 1;
                            if (current_column > number_of_columns) {
                                current_column = 1;
                                smaller_rect.top_left.setX(full_space_rect.get_x());
                                smaller_rect.top_left.mutadd(smaller_rect.size.isolate_y().add(new Vector(0, 10)));
                            }
                        });
                    });
                });
            });
        }

        // Death message
        if (this.death_message !== null) {
            this.draw(() => {
                ctx.fillStyle = "red";
                draw_text(this, width / 2, space_to_play_start_y + 90, "24px bangers", 24 + 4, [this.death_message], AlignmentModes.centered);
            });
        }


        // Navigation
        this.draw(() => {
            const sidebar_text : ITextComponent[][] = [];
            
            // Nav
            sidebar_text.push([
                {
                    bg: get_theme_rainbow(),
                    hover_bg: "#fff",
                    color: get_theme_dark(),
                    text: "  View tutorial  ",
                    click_func_action: () => {
                        this.main_app.show_tutorial();
                    }
                }
            ]);

            sidebar_text.push([
                {
                    bg: "#57ff47",
                    hover_bg: "#fff",
                    color: get_theme_dark(),
                    text: "  Test World  ",
                    click_func_action: () => {
                        this.main_app.active_sub = new TestWorldClient(this.main_app, this.main_app.map_loader);
                    }
                }
            ]);
            
            sidebar_text.push([
                {
                    bg: get_theme_red(),
                    hover_bg: "red",
                    color: "#fff",
                    text: "  Open Editor  ",
                    click_url_action: "/editor"
                }
            ], []);

            // Social
            if (typeof discord_invite_url === "string") {
                sidebar_text.push([
                    {
                        bg: "#7289da",
                        hover_bg: "#677bc4",
                        color: "#fff",
                        text: "  Discord Server  ",
                        click_url_action: discord_invite_url
                    }
                ]);
            }

            if (typeof github_repo_url === "string") {
                sidebar_text.push([
                    {
                        bg: "#24292e",
                        hover_bg: "#111",
                        color: "#fff",
                        text: "  Github Repo  ",
                        click_url_action: github_repo_url
                    }
                ]);
            }
            
            draw_text(this, width + 1, 10, "20px monospace", 20, sidebar_text, AlignmentModes.right);
        })
    }
}

export class LoadingScreen extends CanvasSubApplication {
    app_keydown(e : KeyboardEvent) {
        
    }

    app_keyup(e) {
        
    }

    app_mousedown(e) {
        
    }

    app_mouseup(e) {
        
    }

    app_update(dt : number, ticks_passed : number) {
        
    }

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number) {
        this.draw(() => {
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.font = "24px monospace";
            ctx.fillText("Loading...", width / 2, height / 2);
        });
    }
}