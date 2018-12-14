// THIS FILE IS PURELY A TEST!

import { MapLoader, Layers } from "../../config/MapLoader";
import { CanvasApplication, CanvasSubApplication } from "../../helpers-client/CanvasApplication";
import { ExecMode, RunPlatform } from "../../helpers-common/helpers/RunPlatform";
import { NetworkedGameWorld } from "./NetworkedGameWorld";
import * as SocketIOClient from "socket.io-client";
import { ClientSocket } from "./ClientSocket";
import Vector, { ISerializedVector } from "../../helpers-common/helpers/Vector";
import { PacketNames } from "../../config/ProtocolDefs";
import { CanvasGraph } from "../../helpers-client/CanvasGraph";
import { MainMenuSub, LoadingScreen } from "./MainMenuSub";
import { ITextComponent } from "../../helpers-common/helpers/ITextComponent";
import { LeaderboardLoader } from "./LeaderboardLoader";

RunPlatform.set_platform(ExecMode.client);

const loader = new MapLoader();
let main_game : MainGame = null;
let submitted_captcha_token = undefined;

loader.load_from_url("/map", () => {
    console.log("Loaded map!");

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    main_game = new MainGame(canvas, loader);
    
    if (submitted_captcha_token !== undefined) {
        main_game.set_up_socket(submitted_captcha_token);
    }
});

declare global {
    interface Window { heatgun_global_hooks: any; }
}

window.heatgun_global_hooks = {
    captcha_validated: function(captcha_token : string) {
        console.log("Captcha validation token recieved!");
        if (main_game !== null) {
            main_game.set_up_socket(captcha_token);
        } else {
            submitted_captcha_token = captcha_token;
        }
    }
}

interface KickScreenState {
    top : string
    message : string
}

export class MainGame extends CanvasApplication {
    private active_kick_screen : KickScreenState = null;
    private leaderboard_loader : LeaderboardLoader = new LeaderboardLoader("/leaderboard");
    private active_sub : CanvasSubApplication = new MainMenuSub(this, this.leaderboard_loader);
    
    private socket : ClientSocket = null;

    constructor(canvas : HTMLCanvasElement, private map_loader : MapLoader) {
        super(canvas);
        this.startup();
    }

    set_up_socket(captcha_token : string) {
        this.socket = new ClientSocket(SocketIOClient());
        if (captcha_token !== null) {
            console.log("Sending captcha token");
            this.socket.emit(PacketNames.validate_captcha, captcha_token);
        }

        this.socket.clump_on(PacketNames.state_change__to_game, SocketEventGroups.MAIN, (my_uuid : string, my_name : string, my_position : ISerializedVector) => {
            this.active_sub = new NetworkedGameWorld(this, this.map_loader, this.socket, my_uuid, my_name, Vector.deserialize(my_position));
        });

        this.socket.clump_on(PacketNames.state_change__to_death, SocketEventGroups.MAIN, () => {
            this.socket.unregister_group(SocketEventGroups.GAME);
            this.active_sub = new MainMenuSub(this, this.leaderboard_loader);
            this.leaderboard_loader.load();
        });

        this.socket.underlying_socket.on("disconnect", () => {
            this.active_kick_screen = {
                top: "The server has abandonned you!",
                message: "It closed your socket and you're now very lonely in such a networked world."
            }

            this.socket.underlying_socket.disconnect();
        });
    }

    has_authenticated() {
        return this.socket !== null;
    }

    request_spawn_player(name : string) {
        this.active_sub = new LoadingScreen(this);
        this.socket.emit(PacketNames.play, name);
    }

    app_keydown(e : KeyboardEvent) {
        if (this.active_kick_screen !== null) return;
        if (this.active_sub) this.active_sub.app_keydown(e);
    }

    app_keyup(e) {
        if (this.active_kick_screen !== null) return;
        if (this.active_sub) this.active_sub.app_keyup(e);
    }

    app_mousedown(e) {
        if (this.active_kick_screen !== null) return;
        if (this.active_sub) this.active_sub.app_mousedown(e);
    }

    app_mouseup(e) {
        if (this.active_kick_screen !== null) return;
        if (this.active_sub) this.active_sub.app_mouseup(e);
    }

    app_update(dt : number, ticks_passed : number) {
        if (this.active_kick_screen !== null) return;
        if (this.active_sub) this.active_sub.app_update(dt, ticks_passed);
    }

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number) {
        if (this.active_sub) this.active_sub.app_render(ctx, width, height, ticks_passed);

        // CanvasGraph.render(this);

        if (this.active_kick_screen !== null) {
            this.draw(() => {
                ctx.fillStyle = "#000";
                ctx.globalAlpha = 0.9;
                ctx.fillRect(0, 0, width, height);
            });

            this.draw(() => {
                ctx.fillStyle = "#fff";
                ctx.font = "20px monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                this.draw(() => {
                    ctx.font = "30px monospace";
                    ctx.fillStyle = "red";
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "red";
                    ctx.fillText(this.active_kick_screen.top, width / 2, height / 2 - 25);
                });

                ctx.fillText(this.active_kick_screen.message, width / 2, height / 2 + 25);
            });
        }
    }
}

export enum SocketEventGroups {
    MAIN = 0,
    GAME
}