import { GameWorld } from "./GameWorld";
import { CanvasApplication } from "../../helpers-client/CanvasApplication";
import { MapLoader } from "../../config/MapLoader";
import { ClientSocket } from "./ClientSocket";
import Vector, { ISerializedVector } from "../../helpers-common/helpers/Vector";
import { ClientPlayer } from "./ClientPlayer";
import { PacketNames } from "../../config/ProtocolDefs";
import { IWeapon } from "../../helpers-common/Weapon";
import { RushDirections } from "../../helpers-common/RushDirections";
import { ITextComponent } from "../../helpers-common/helpers/ITextComponent";
import { MainGame, SocketEventGroups } from "./entry";

export class NetworkedGameWorld extends GameWorld {
    constructor(private main_game : MainGame, map_loader : MapLoader, private socket : ClientSocket, my_uuid : string, my_name: string, my_spawn : Vector) {
        super(main_game, map_loader, my_uuid, my_name, my_spawn);

        this.socket.clump_on(PacketNames.replicate_player_list, SocketEventGroups.GAME, (own_uuid : string, other_users : {[uuid : string] : string}) => {

            this.world.players.forEach(player => {
                if (!(player.uuid in other_users)) {
                    this.world.players.delete(player.uuid);
                }
            });

            for (let user_uuid in other_users) {
                if (!this.world.players.has(user_uuid)) {
                    const player = new ClientPlayer(this.world, other_users[user_uuid]);
                    player.uuid = user_uuid;
                    this.world.players.set(user_uuid, player);
                }
            }
        });

        this.socket.clump_on(PacketNames.send_message, SocketEventGroups.GAME, (message : ITextComponent) => {
            // @TODO do!
        });

        this.socket.clump_on(PacketNames.replicate_player_health_changed, SocketEventGroups.GAME, (target_uuid : string, health : number) => {
            if (this.world.players.has(target_uuid)) {
                const target_player = this.world.players.get(target_uuid);

                target_player.health = health;
            }
        });

        this.socket.clump_on(PacketNames.replicate_weapon_info_change, SocketEventGroups.GAME, (target_uuid : string, weapon_info : IWeapon[]) => {
            if (this.world.players.has(target_uuid)) {
                const target_player = this.world.players.get(target_uuid);

                target_player.weapons.forEach((weapon, i) => {
                    weapon.replicated_data = weapon_info[i];
                });
            }
        });

        this.socket.clump_on(PacketNames.replicate_player_mov_changed, SocketEventGroups.GAME, (
            target_uuid : string,
            position : ISerializedVector,
            velocity : ISerializedVector,
            can_use_rush : boolean,
            using_scope : boolean,
            force : boolean
        ) => {
            if (this.world.players.has(target_uuid)) {
                const target_player = this.world.players.get(target_uuid);
                
                if (force || target_uuid !== this.local_player.uuid) {
                    target_player.position.setPair(position.x, position.y);
                    target_player.velocity.setPair(velocity.x, velocity.y);
                    target_player.can_use_rush = can_use_rush;
                    target_player.using_scope = using_scope;
                }
            } else {
                console.log("The player doesn't exist!");
            }
        });

        this.socket.clump_on(PacketNames.replicate_new_beam, SocketEventGroups.GAME, ( orgin_player_uuid : string, path : ISerializedVector[], color : string, size : number ) => {
            if (orgin_player_uuid === this.local_player.uuid) return; // We don't want to add the same beam twice!

            console.log({
                color, size, path: path.map(svec => Vector.deserialize(svec)),
                delete_flag: false, path_lerping: false
            });
            this.world.beams.push({
                color, size, path: path.map(svec => Vector.deserialize(svec)),
                delete_flag: false, path_lerping: false
            });
        });

        this.socket.clump_on(PacketNames.replicate_energy_change, SocketEventGroups.GAME, (target_uuid : string, energy : number, total_energy : number) => {
            if (this.world.players.has(target_uuid)) {
                const target_player = this.world.players.get(target_uuid);

                target_player.energy = energy;
                target_player.total_energy = total_energy;
            }
        });
        
        this.socket.underlying_socket.on("custom_pong", (s) => {
            this.ping = Date.now() - s;
        });
    }

    app_update(delta : number) {
        super.app_update(delta);

        if (this.get_total_frames() % 60 === 0) {
            this.socket.underlying_socket.emit("custom_ping", Date.now());
        }
    }

    handle_shot(look_direction : Vector) {
        this.socket.emit(PacketNames.shoot_gun, look_direction.getdeg(), this.local_player.selected_slot, this.local_player.position.serialize());
    }

    handle_scope(bool : boolean) {
        this.socket.emit(PacketNames.set_scope, bool, this.local_player.position.serialize());
    }

    handle_dash(dir : RushDirections) {
        this.socket.emit(PacketNames.perform_dash, this.local_player.position.serialize(), dir);
    }

    handle_stats_change(weapon_index : number, stat_index : number, is_upgrade : boolean) {
        console.log("Stats changed!");
        this.socket.emit(PacketNames.modify_weapon_trait, weapon_index, stat_index, is_upgrade);
    }
}