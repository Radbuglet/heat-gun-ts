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

RunPlatform.set_platform(ExecMode.client);

const loader = new MapLoader();
loader.load_from_url("/map", () => {
    console.log("Loaded!");

    new MainGame(document.getElementById("game") as HTMLCanvasElement, loader);
});

interface KickScreenState {
    top : string
    message : string
}

export class MainGame extends CanvasApplication {
    private active_sub : CanvasSubApplication = new MainMenuSub(this);
    private active_kick_screen : KickScreenState = null;
    
    private socket : ClientSocket;

    constructor(canvas : HTMLCanvasElement, loader : MapLoader) {
        super(canvas);

        this.socket = new ClientSocket(SocketIOClient());

        this.socket.clump_on(PacketNames.state_change__to_game, (my_uuid : string, my_name : string, my_position : ISerializedVector) => {
            this.active_sub = new NetworkedGameWorld(this, loader, this.socket, my_uuid, my_name, Vector.deserialize(my_position));
        });

        this.socket.underlying_socket.on("disconnect", () => {
            this.active_kick_screen = {
                top: "The server has abandonned you!",
                message: "It closed your socket and you're now very lonely in such a networked world."
            }

            this.socket.underlying_socket.disconnect();
        });

        this.startup();
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