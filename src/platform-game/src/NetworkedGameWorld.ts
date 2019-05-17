import { GameClient } from "./GameClient";
import { CanvasApplication } from "../../helpers-client/CanvasApplication";
import { MapLoader } from "../../helpers-common/MapLoader";
import { ClientSocket } from "./ClientSocket";
import Vector, { ISerializedVector } from "../../helpers-common/helpers/Vector";
import { ClientPlayer } from "./ClientPlayer";
import { PacketNames } from "../../helpers-common/ProtocolDefs";
import { IWeapon } from "../../helpers-common/Weapon";
import { RushDirections } from "../../helpers-common/RushDirections";
import { ITextComponent } from "../../helpers-common/helpers/ITextComponent";
import { MainGame, SocketEventGroups } from "./entry";
import { ClientPowerUpCrystal } from "./ClientPowerUpCrystal";

export class NetworkedGameWorld extends GameClient {
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

            this.world.beams.push({
                color, size, path: path.map(svec => Vector.deserialize(svec)),
                delete_flag: false, path_lerping: false, is_from_other: true
            });
        });

        this.socket.clump_on(PacketNames.replicate_energy_change, SocketEventGroups.GAME, (target_uuid : string, energy : number, total_energy : number) => {
            if (this.world.players.has(target_uuid)) {
                const target_player = this.world.players.get(target_uuid);

                target_player.energy = energy;
                target_player.total_energy = total_energy;
            }
        });

        this.socket.clump_on(PacketNames.send_message, SocketEventGroups.GAME, (message : ITextComponent[]) => {
            this.local_player.send_message(message);
        });

        this.socket.clump_on(PacketNames.replicate_slot_change, SocketEventGroups.GAME, (target_uuid : string, slot : number) => {
            if (this.world.players.has(target_uuid) && target_uuid !== this.local_player.uuid) {
                const target_player = this.world.players.get(target_uuid);
                target_player.select_slot(slot);
            }
        });

        this.socket.clump_on(PacketNames.replicate_player_crystal_state, SocketEventGroups.GAME, (target_uuid : string, powerup_id : number, active : boolean, time_left : number) => {
            if (this.world.players.has(target_uuid)) {
                const target_player = this.world.players.get(target_uuid);

                target_player.powerup_slot = powerup_id;
                target_player.is_powerup_active = active;
                target_player.power_up_time_left = time_left;
            }
        });

        this.socket.clump_on(PacketNames.replicate_player_damaged, SocketEventGroups.GAME, (attacker : string, target_uuid : string, damage : number) => {
            if (this.world.players.has(target_uuid)) {
                const target_player = this.world.players.get(target_uuid);
                target_player.particlehandle__damaged(damage);
            }
        });

        this.socket.clump_on(PacketNames.replicate_crystal_list, SocketEventGroups.GAME, (crystals) => {
            this.world.powerup_crystals.forEach(crystal => {
                if (!(crystal.uuid in crystals)) {
                    this.world.powerup_crystals.delete(crystal.uuid);
                }
            });

            for (let crystal_uuid in crystals) {
                if (!this.world.powerup_crystals.has(crystal_uuid)) {
                    const crystal = new ClientPowerUpCrystal(this.world);
                    crystal.uuid = crystal_uuid;
                    crystal.collision_rect.top_left = Vector.deserialize(crystals[crystal_uuid][0]);
                    crystal.powerup_type = parseInt(crystals[crystal_uuid][1]);
                    this.world.powerup_crystals.set(crystal_uuid, crystal);
                }
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

    handle_shot(look_direction : Vector, look_magnitude : number) {
        this.socket.emit(PacketNames.shoot_gun, look_direction.getdeg(), look_magnitude, this.local_player.get_selected_slot(), this.local_player.position.serialize());
    }

    handle_scope(bool : boolean) {
        this.socket.emit(PacketNames.set_scope, bool, this.local_player.position.serialize());
    }

    handle_dash(dir : RushDirections) {
        this.socket.emit(PacketNames.perform_dash, this.local_player.position.serialize(), dir);
    }

    handle_powerup_activate() {
        this.socket.emit(PacketNames.perform_activate_powerup);
    }

    handle_stats_change(weapon_index : number, stat_index : number, is_upgrade : boolean) {
        console.log("Stats changed!");
        this.socket.emit(PacketNames.modify_weapon_trait, weapon_index, stat_index, is_upgrade);
    }
}