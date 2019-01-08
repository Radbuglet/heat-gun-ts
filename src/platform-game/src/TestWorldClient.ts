import { GameClient } from "./GameClient";
import Vector from "../../helpers-common/helpers/Vector";
import { MapLoader } from "../../helpers-common/MapLoader";
import { Player } from "../../helpers-common/Player";
import { ClientPlayer } from "./ClientPlayer";
import { draw_text, AlignmentModes } from "../../helpers-client/draw_text";
import { get_theme_rainbow, get_theme_dark, get_theme_red } from "../../helpers-client/ColorTheme";
import { DEFAULT_ENERGY, MAX_HEALTH } from "../../config/Config";
import { MainGame } from "./entry";
import { MainMenuSub } from "./menu/MainMenuSub";

export class TestWorldClient extends GameClient {
    constructor(private main_app : MainGame, maploader : MapLoader) {
        super(main_app, maploader, "", " ", new Vector(0, 0), {
            can_perform_next_slot_select: true,
            can_perform_regen: true,
            can_perform_shot_damage: true
        });

        setTimeout(() => {
            const bot = new ClientPlayer(this.world, "BOT");
            this.world.add_player(bot);
            this.testworld_bot = bot;
        }, 20);

        this.world.broadcast_message([
            {
                color: "red",
                text: "[Test World] Welcome to the test world."
            }
        ]);
    }
    handle_dash() {

    }

    handle_scope() {

    }

   handle_shot() {

   } 

   handle_stats_change() {

   }

   app_render(ctx : CanvasRenderingContext2D, width : number, height : number) {
        super.app_render(ctx, width, height);

        draw_text(this, width, 0, "20px monospace", 20, [
            [
                {
                    bg: get_theme_red(),
                    color: "#fff",
                    text: " >>> Cheats <<< "
                }
            ],
            [],
            [
                {
                    bg: "#3a3a3a",
                    color: "#fff",
                    text: " R ",
                },
                {
                    bg: get_theme_dark(),
                    color: get_theme_red(),
                    text: " Reheal BOT ",
                }
            ],
            [
                {
                    bg: "#3a3a3a",
                    color: "#fff",
                    text: " E ",
                },
                {
                    bg: get_theme_dark(),
                    color: "#57ff47",
                    text: " Set Energy ",
                }
            ],
            [],
            [
                {
                    bg: get_theme_rainbow(),
                    color: get_theme_dark(),
                    text: " Back to menu ",
                    hover_bg: "#fff",
                    click_func_action: () => {
                        this.main_app.goto_main_menu();
                    }
                }
            ]
        ], AlignmentModes.right);
   }

   app_keydown(e : KeyboardEvent) {
       super.app_keydown(e);

       if (e.code === "KeyR") {
           this.testworld_bot.health = MAX_HEALTH;
       }

       if (e.code === "KeyE") {
        this.going_to_display_prompt();
        const new_energy = +prompt("Enter energy", this.local_player.energy.toString());

        if (!isNaN(new_energy)) {
            this.local_player.energy = new_energy;
            this.local_player.total_energy = new_energy;
        }
    }
   }
}