// @TODO leaderboards
// @TODO:MAJOR Replicate things in world!

import * as express from "express";
import { static as serveStatic } from "express";
import * as socketio from "socket.io";
import { createServer } from "http";

import { join } from "path";

import { SERVER_PORT, GAME_VERSION } from "../config/Config";
import { MapLoader } from "../config/MapLoader";
import { ServerWorld } from "./ServerWorld";
import { ServerPlayer } from "./ServerPlayer";
import { SocketUser } from "./SocketUser";
import { num_in_range, calculate_ticks, torad } from "../helpers-common/helpers/Math";
import Vector, { ISerializedVector } from "../helpers-common/helpers/Vector";
import { Weapon, configurable_traits } from "../helpers-common/Weapon";
import { RunPlatform, ExecMode } from "../helpers-common/helpers/RunPlatform";
import { readFileSync } from "fs";
import { PacketNames } from "../config/ProtocolDefs";
import { Leaderboard } from "./Leaderboard";

const now = require("performance-now");

console.log(`Heat Gun Server ~~ Version ${GAME_VERSION}`);

RunPlatform.set_platform(ExecMode.server);

const source_root_path = join(__dirname, "../");

const map_loader = new MapLoader();
map_loader.load_from_loaded_file(
    readFileSync(join(source_root_path, "config/map_data.json"), "utf-8"));

Leaderboard.load_file(join(__dirname, "db", "leaderboard.json"));

/*
    Create and configure express app
*/
const app = express();

app.get("/", (req, res) => {
    res.sendFile(join(source_root_path, "platform-game/static/index.html"));
});

app.get("/map", (req, res) => {
    res.send(map_loader.get_raw_map_object());
});

app.get("/leaderboard", (req, res) => {
    res.send(Leaderboard.data);
});

app.get("/favicon.ico", (req, res) => res.sendFile(join(__dirname, 'favicon.ico')));

app.use("/static/game", serveStatic(join(source_root_path, "platform-game/static")));
app.use("/static/editor", serveStatic(join(source_root_path, "platform-editor/static")));

app.use((req, res) => { // 404
    res.redirect("/");
});


/*
    Create socket for realtime communication
    and set up game logic
*/
const server = createServer(app);
const socketserver = socketio(server);

const world = new ServerWorld(map_loader);

const connected_ips : Map<string, socketio.Socket> = new Map();

socketserver.on("connection", socket => {
    if (socket.handshake.address !== "::1") {
        if (connected_ips.has(socket.handshake.address)) {
            // @TODO kick message
            connected_ips.get(socket.handshake.address).disconnect();
        }
    
        connected_ips.set(socket.handshake.address, socket);   
    }

    let socket_user : SocketUser = new SocketUser(socket, world);

    socket.on((PacketNames.play as number).toString(), (username : string) => {
        if (typeof username === "string" && ServerPlayer.is_valid_username(username) === null && !socket_user.is_playing()) {
            world.wrapped_queue_packets(() => {
                socket_user.play(username);

                world.broadcast_message([{
                    color: "#ee1a1a",
                    text: username
                  },
                  {
                    color: "gray",
                    text: " joined the area"
                  }
                ]);
            });
        }
    });

    socket.on("custom_ping", (client_sent_timestamp : number) => {
        if (typeof client_sent_timestamp === "number") {
            socket.emit("custom_pong", client_sent_timestamp); // Echo back the timestamp
        }
    });

    socket.on("slot_change", (new_slot : number) => {
        if (
            typeof new_slot === "number" && Weapon.is_valid_slot_index(new_slot) && // Argument validation
            socket_user.is_playing() // Gameplay checks
        ) {
            world.wrapped_queue_packets(() => {
                socket_user.player.selected_slot = new_slot;
                socket_user.player.handle_slot_changed();
            });
        }
    });

    socket.on((PacketNames.perform_dash as number).toString(), (position : ISerializedVector, direction_enum_value : number) => {
        if (
            typeof direction_enum_value === "number" && num_in_range(0, direction_enum_value, 3) && // Argument validation
            Vector.is_valid_serialized_vector(position) &&
            socket_user.is_playing() && socket_user.player.can_use_rush // Gameplay checks
        ) {
            world.wrapped_queue_packets(() => {
                const player = socket_user.player; // Store reference to player because `socket_user.player` everywhere looks ugly.

                if (!player.is_on_ground()) player.can_use_rush = false; 

                player.sync_pos(Vector.deserialize(position), () => {
                    player.rush(direction_enum_value);
                });
            });
        }
    });

    socket.on((PacketNames.set_scope as number).toString(), (new_scope_state : boolean, position : ISerializedVector) => {
        if (socket_user.is_playing() &&
            typeof new_scope_state === "boolean" && Vector.is_valid_serialized_vector(position)
        ) {
            const player = socket_user.player;
            if (player.using_scope === new_scope_state) return;

            player.sync_pos(Vector.deserialize(position), () => {
                world.wrapped_queue_packets(() => {
                    player.using_scope = new_scope_state;
                    player.handle_movementstate_changed(false);
                });
            });
        }
    });

    socket.on((PacketNames.shoot_gun as number).toString(), (direction : number, slot : number, position : ISerializedVector) => {
        if (
            typeof slot === "number" && Weapon.is_valid_slot_index(slot) && // Argument validation
            typeof direction === "number" && num_in_range(-180, direction, 180) &&
            Vector.is_valid_serialized_vector(position) &&
            socket_user.is_playing() // Gameplay checks
        ) {
            const player = socket_user.player;
            if (slot !== player.selected_slot) {
                player.selected_slot = slot;
                socket_user.player.handle_slot_changed();
            }

            player.sync_pos(Vector.deserialize(position), () => {
                player.get_active_weapon().shoot(Vector.from_angle(torad(direction)));
            });
        }
    });

    socket.on("use_power_up", () => {
        if (socket_user.is_playing()) {
            const player = socket_user.player;

            if (player.power_up_slot !== null && player.current_power_up === null) {
                player.activate_powerup();
            }
        }
    });

    socket.on((PacketNames.modify_weapon_trait as number).toString(), (weapon_index : number, trait_index : number, is_increase : boolean) => {
        if (
            socket_user.is_playing()

            && typeof weapon_index === "number" && Weapon.is_valid_slot_index(weapon_index)
            && typeof trait_index === "number" && num_in_range(0, trait_index, configurable_traits.length)
            && typeof is_increase === "boolean"
        ) {
            const player = socket_user.player;
            const weapon = player.weapons[weapon_index];

            world.wrapped_queue_packets(() => {
                if (is_increase) {
                    weapon.upgrade_trait(configurable_traits[trait_index]);
                } else {
                    weapon.downgrade_trait(configurable_traits[trait_index]);
                }
                player.handle_weaponinfo_changed();
            });
        }
    });

    socket.on("disconnect", () => {
        connected_ips.delete(socket.handshake.address);

        if (socket_user.is_playing()) {
            world.broadcast_message([{
                color: "darkred",
                text: socket_user.player.name
            }, {
                color: "red",
                text: " rage quit the arena!"
            }]);
            socket_user.notify_kill_and_remove(null);
        }
    });
});

let last_update_timestamp = now();
let total_runtime_ms = 0;
let total_runtime_ticks = 0;
setInterval(() => {
    const delta = now() - last_update_timestamp;
    last_update_timestamp = now();
    
    const ticks = calculate_ticks(delta);

    total_runtime_ms += delta;
    total_runtime_ticks += ticks;
    
    world.update({
        exec_mode: ExecMode.server,
        delta, ticks,
        
        total_ms: total_runtime_ms,
        total_ticks: total_runtime_ticks
    });

    // world.players.forEach(player => console.log(player.position.toString()));
}, 1000 / 60);

setInterval(() => {
    world.queue_all_players_packets();
    world.replicate_everything(false);
    world.unqueue_all_players_packets();
}, 2000);

setInterval(() => {
    Leaderboard.clean_up();
    Leaderboard.save_to_active_file();
}, 1000 * 10);

server.listen(SERVER_PORT);
console.log(`Server listening on port ${SERVER_PORT}`);
