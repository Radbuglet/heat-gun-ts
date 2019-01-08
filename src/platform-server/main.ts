import * as express from "express";
import { static as serveStatic } from "express";
import * as socketio from "socket.io";
import { createServer } from "http";

import { join } from "path";

import { SERVER_PORT, GAME_VERSION, discord_invite_url } from "../config/Config";
import { MapLoader } from "../helpers-common/MapLoader";
import { ServerWorld } from "./ServerWorld";
import { ServerPlayer } from "./ServerPlayer";
import { SocketUser } from "./SocketUser";
import { num_in_range, calculate_ticks, torad } from "../helpers-common/helpers/Math";
import Vector, { ISerializedVector } from "../helpers-common/helpers/Vector";
import { Weapon, configurable_traits } from "../helpers-common/Weapon";
import { readFileSync } from "fs";
import { PacketNames } from "../helpers-common/ProtocolDefs";
import { Leaderboard } from "./Leaderboard";
import { compile } from "handlebars";
import { post } from 'request';
import { recaptcha_credentials } from "../config/Credentials";

const now = require("performance-now");

console.log(`Heat Gun Server ~~ Version ${GAME_VERSION}`);

const source_root_path = join(__dirname, "../");

const map_loader = new MapLoader();
map_loader.load_from_loaded_file(
    readFileSync(join(source_root_path, "config/map_data.json"), "utf-8"));

Leaderboard.load_file(join(__dirname, "db", "leaderboard.json"));

/*
    Create and configure express app
*/
const app = express();

const game_page_template = compile(readFileSync(join(source_root_path, "platform-game/static/index.hbs"), "utf-8"));
app.get("/", (req, res) => {
    res.send(game_page_template({
        discord_invite_url: discord_invite_url,
        recaptcha_sitekey: recaptcha_credentials.enabled ? recaptcha_credentials.pub : null
    }));
});

app.get("/editor", (req, res) => {
    res.sendFile(join(source_root_path, "platform-editor/static/index.html"));
});

app.get("/map", (req, res) => {
    res.send(map_loader.get_raw_map_object());
});

app.get("/leaderboard", (req, res) => {
    res.send(Leaderboard.data);
});

app.get("/playercount", (req, res) => {
    res.send(world.players.size.toString());
});

app.get("/favicon.ico", (req, res) => res.sendFile(join(__dirname, 'favicon.ico')));

app.use("/static/game", serveStatic(join(source_root_path, "platform-game/static")));
app.use("/static/editor", serveStatic(join(source_root_path, "platform-editor/static")));
app.use("/static/img", serveStatic(join(source_root_path, "img/")));

app.use((req, res) => { // 404
    res.redirect("/");
});


/*
    Create socket for realtime communication
    and set up game logic
*/
const server = createServer(app);
const socketserver = socketio(server);

const world = new ServerWorld(map_loader, {
    can_perform_next_slot_select: false,
    can_perform_regen: true,
    can_perform_shot_damage: true
});

socketserver.on("connection", socket => {
    let socket_user : SocketUser = new SocketUser(socket, world);
    let captcha_validated = false;

    socket.on((PacketNames.play as number).toString(), (username : string) => {
        if (recaptcha_credentials.enabled && !captcha_validated) {
            socket.disconnect();
            return;
        }

        if (typeof username === "string" && ServerPlayer.is_valid_username(username) === null && !socket_user.is_playing()) {
            socket_user.play(username);
        }
    });

    socket.on((PacketNames.validate_captcha as number).toString(), (token : string) => {
        if (recaptcha_credentials.enabled && typeof token === "string" && token.length <= 1000 && !socket_user.is_playing() && !captcha_validated) {
            post("https://www.google.com/recaptcha/api/siteverify", {
                formData: {
                    secret: "6LfDx38UAAAAAMJfcGeJ7QeU7A3ukXday3pDF3A5",
                    response: token
                }
            }, function(err, resp, body) {
                if (!err && resp.statusCode === 200 && JSON.parse(body.toString()).success) {
                    captcha_validated = true;
                } else {
                    socket.disconnect();
                }
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
                socket_user.player.select_slot(new_slot);
        }
    });

    socket.on((PacketNames.perform_dash as number).toString(), (position : ISerializedVector, direction_enum_value : number) => {
        if (
            typeof direction_enum_value === "number" && num_in_range(0, direction_enum_value, 3) && // Argument validation
            Vector.is_valid_serialized_vector(position) &&
            socket_user.is_playing() && socket_user.player.can_use_rush // Gameplay checks
        ) {
            const player = socket_user.player; // Store reference to player because `socket_user.player` everywhere looks ugly.

            player.sync_pos(Vector.deserialize(position), () => {
                if (!player.is_on_ground()) player.can_use_rush = false; 

                player.rush(direction_enum_value);
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
                player.using_scope = new_scope_state;
                player.replicate__movementstate_changed(false);
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
            if (slot !== player.get_selected_slot()) {
                player.select_slot(slot);
            }

            player.sync_pos(Vector.deserialize(position), () => {
                player.get_active_weapon().shoot(Vector.from_angle(torad(direction)));
            });
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

            if (is_increase) {
                weapon.upgrade_trait(configurable_traits[trait_index]);
            } else {
                weapon.downgrade_trait(configurable_traits[trait_index]);
            }
        }
    });

    socket.on("disconnect", () => {
        if (socket_user.is_playing()) {
            world.broadcast_message([]);
            world.broadcast_message([{
                color: "darkred",
                text: socket_user.player.name
            }, {
                color: "red",
                text: " rage quit the arena!"
            }]);
            world.broadcast_message([]);
            socket_user.notify_kill_and_remove(null);
        }
    });
});

let last_update_timestamp = now();
let total_runtime_ms = 0;
let total_runtime_ticks = 0;
let total_runtime_runs = 0;
setInterval(() => {
    const delta = now() - last_update_timestamp;
    last_update_timestamp = now();
    
    const ticks = calculate_ticks(delta);

    total_runtime_ms += delta;
    total_runtime_ticks += ticks;
    total_runtime_runs++;
    
    world.update({
        delta, ticks,
        
        total_ms: total_runtime_ms,
        total_ticks: total_runtime_ticks
    });
}, 1000 / 60);

setInterval(() => {
    world.replicate_everything(false);
}, 2000);

setInterval(() => {
    Leaderboard.clean_up();
    Leaderboard.save_to_active_file();
}, 1000 * 10);

server.listen(SERVER_PORT);
console.log(`Server listening on port ${SERVER_PORT}`);
