import { Player, IDeathHandlerInfo } from "../helpers-common/Player";
import { ServerWorld } from "./ServerWorld";
import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { SocketUser } from "./SocketUser";
import { PacketNames } from "../config/ProtocolDefs";

export class ServerPlayer extends Player<ServerWorld> {
    constructor(public user : SocketUser, world : ServerWorld, name : string) {
        super(world, name);
    }

    // @TODO add good replication
    handle_death(death_info : IDeathHandlerInfo, socket_disconnected = false) {
        this.world.broadcast_message(death_info.public_message);
        this.user.notify_kill_and_remove(death_info.personal_message, socket_disconnected);
    }

    handle_movementstate_changed(forceful : boolean) {
        this.world.broadcast_packet(PacketNames.replicate_player_mov_changed,
            this.uuid,
            this.position.serialize(),
            this.velocity.serialize(),
            this.can_use_rush,
            this.using_scope,
            forceful);
    }

    handle_health_changed() {
        this.world.broadcast_packet(PacketNames.replicate_player_health_changed, this.uuid, this.health);
    }

    handle_player_shoot_gun() {
        // @TODO
    }

    handle_weaponinfo_changed() {
        this.world.broadcast_packet(PacketNames.replicate_weapon_info_change, this.uuid, this.weapons.map(weapon => weapon.replicated_data));
    }

    handle_energy_changed() {
        this.world.broadcast_packet(PacketNames.replicate_energy_change, this.uuid, this.energy, this.total_energy);
    }

    handle_powerupstate_changed() {
        
    }

    handle_slot_changed() {
        this.world.broadcast_packet(PacketNames.replicate_slot_change, this.uuid, this.selected_slot);
    }

    send_message(message : ITextComponent[]) {
        this.user.send_packet(PacketNames.send_message, message);
    }
}

export interface IPacket {
    evt_name : PacketNames,
    args : any[]
}