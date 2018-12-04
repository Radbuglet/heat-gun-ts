import { CanvasSubApplication } from "../../helpers-client/CanvasApplication";
import { rainbow_color } from "../../helpers-client/color";
import { Rect } from "../../helpers-common/helpers/Rect";
import Vector from "../../helpers-common/helpers/Vector";
import { torad } from "../../helpers-common/helpers/Math";
import { MainGame } from "./entry";
import { Player } from "../../helpers-common/Player";
import { CloudHorizon } from "./CloudHorizon";

export class MainMenuSub extends CanvasSubApplication {
    private bg_scroll_y : number = 0;
    private cloud_horizon : CloudHorizon = new CloudHorizon(this);

    constructor(private main_app : MainGame) {
        super(main_app);
    }

    app_keydown(e : KeyboardEvent) {
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
    }

    app_keyup(e) {
        
    }

    app_mousedown(e) {
        
    }

    app_mouseup(e) {
        
    }

    app_update(dt : number, ticks_passed : number) {
        this.bg_scroll_y += ticks_passed * 2;
    }

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number) {
        const screen_rect = new Rect(new Vector(0, 0), new Vector(width, height));
        // Background Grid
        this.draw(() => {
            ctx.strokeStyle = "hsla(0, 100%, 63%)";
            ctx.globalAlpha = 0.1;
            ctx.lineWidth = 4;

            for (let y = 0; y < (height - 1) * 2; y += height / 50) {
                const actual_start_y = ((y + this.bg_scroll_y) % (height * 2)) - height;
                ctx.beginPath();
                ctx.moveTo(0, actual_start_y);
                ctx.lineTo(width, actual_start_y + height);
                ctx.stroke();
            }
        });

        this.cloud_horizon.draw();

        // Logo
        this.draw(() => {
            const logo_text = "Heat Gun";
            const logo_font_size = 120;

            ctx.fillStyle = "yellow";
            ctx.strokeStyle = "#ff0a12";
            ctx.shadowColor = "#ff0a12";
            ctx.shadowBlur = 5;
            ctx.lineWidth = 1;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = 0.6;
            ctx.font = logo_font_size + "px 'Bangers'";

            const logo_width = ctx.measureText(logo_text).width;
            const logo_rect = new Rect(
                screen_rect.get_point(0.5, 0.2).sub(new Vector(logo_width / 2, -logo_font_size / 2)),
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
            ctx.font = "40px 'Bangers'";
            ctx.fillStyle = "#bbb";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Press space to play", screen_rect.get_point(0.5, 0.7).getX(), screen_rect.get_point(0.5, 0.7).getY());

            ctx.fillStyle = "#ccc";
            ctx.font = "20px 'Bangers'";
            ctx.fillText("Pro tip: Press enter to play with last name", screen_rect.get_point(0.5, 0.8).getX(), screen_rect.get_point(0.5, 0.8).getY());


        });
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
            ctx.textBaseline = "top";
            ctx.font = "24px monospace";
            ctx.fillText("Loading...", 0, 0);
        });
    }
}