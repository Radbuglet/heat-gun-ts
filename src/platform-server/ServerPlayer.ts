import { Player, IDeathHandlerInfo } from "../helpers-common/Player";
import { ServerWorld } from "./ServerWorld";
import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { SocketUser } from "./SocketUser";
import { PacketNames } from "../helpers-common/ProtocolDefs";
import { World } from "../helpers-common/World";

export class ServerPlayer extends Player<ServerWorld> {
    constructor(public user : SocketUser, world : ServerWorld, name : string) {
        super(world, name);
    }

  replicate_own_state(forceful : boolean) {
    this.replicate__energy_changed();
    this.replicate__health_changed();
    this.replicate__movementstate_changed(forceful);
    this.replicate__slot_changed();
  }

    replicate__damaged(attacker : Player<World<any>>, damage : number) {
        this.world.broadcast_packet(PacketNames.replicate_player_damaged, (attacker ? attacker.uuid : null), this.uuid, damage);
    }

    // @TODO add good replication
    replicate__death(death_info : IDeathHandlerInfo, socket_disconnected = false) {
        this.world.broadcast_message([]);
        this.world.broadcast_message(death_info.public_message);
        this.world.broadcast_message([]);
        this.user.notify_kill_and_remove(death_info.personal_message, socket_disconnected);
    }

    replicate__movementstate_changed(forceful : boolean) {
        this.world.broadcast_packet(PacketNames.replicate_player_mov_changed,
            this.uuid,
            this.position.serialize(),
            this.velocity.serialize(),
            this.can_use_rush,
            this.using_scope,
            forceful);
    }

    replicate__health_changed() {
        this.world.broadcast_packet(PacketNames.replicate_player_health_changed, this.uuid, this.health);
    }

    replicate__weaponinfo_changed() {
        this.world.broadcast_packet(PacketNames.replicate_weapon_info_change, this.uuid, this.weapons.map(weapon => weapon.replicated_data));
    }

    replicate__energy_changed() {
        this.world.broadcast_packet(PacketNames.replicate_energy_change, this.uuid, this.energy, this.total_energy);
    }

    replicate__slot_changed() {
        this.world.broadcast_packet(PacketNames.replicate_slot_change, this.uuid, this.get_selected_slot());
    }

    send_message(message : ITextComponent[]) {
        this.user.send_packet(PacketNames.send_message, message);
    }
}

export interface IPacket {
    evt_name : PacketNames,
    args : any[]
}