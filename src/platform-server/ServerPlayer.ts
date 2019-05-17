import { Player, IDeathHandlerInfo } from "../helpers-common/Player";
import { ServerWorld } from "./ServerWorld";
import { ITextComponent } from "../helpers-common/helpers/ITextComponent";
import { SocketUser } from "./SocketUser";
import { PacketNames } from "../helpers-common/ProtocolDefs";
import { IUpdate } from "../helpers-common/helpers/IUpdate";
import { RushDirections } from "../helpers-common/RushDirections";
import { ServerWeapon } from "./ServerWeapon";
import { ServerPowerUpCrystal } from "./ServerPowerUpCrystal";
import { PowerUpTypes } from "../helpers-common/PowerUpTypes";

export class ServerPlayer extends Player<ServerWorld, ServerPlayer, ServerWeapon, ServerPowerUpCrystal> {
    constructor(public user : SocketUser, world : ServerWorld, name : string) {
        super(world, name);
    }

  replicate_own_state(forceful : boolean) {
    this.world.wrapped_queue_packets(() => {
        this.replicate__energy_changed();
        this.replicate__health_changed();
        this.replicate__movementstate_changed(forceful);
        this.replicate__slot_changed();
        this.replicate__powerup_state();
    });
  }

    replicate__death(death_info : IDeathHandlerInfo, socket_disconnected = false) {
        this.world.wrapped_queue_packets(() => {
            this.world.broadcast_message([]);
            this.world.broadcast_message(death_info.public_message);
            this.world.broadcast_message([]);
            this.user.notify_kill_and_remove(death_info.personal_message, socket_disconnected);
        });
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

    replicate__powerup_state() {
        this.world.broadcast_packet(PacketNames.replicate_player_crystal_state, this.uuid, this.powerup_slot, this.is_powerup_active, this.power_up_time_left);
    }

    send_message(message : ITextComponent[]) {
        this.user.send_packet(PacketNames.send_message, message);
    }


    /*
        Method replication handlers
    */

    set_slot_powerup(type : PowerUpTypes) {
        super.set_slot_powerup(type);
        this.replicate__powerup_state();
    }
    
    select_slot(slot : number) : boolean {
        const slot_changed = super.select_slot(slot);
        if (slot_changed) this.replicate__slot_changed();
        return slot_changed;
    }

    set_health(new_health : number) {
        super.set_health(new_health);
        this.replicate__health_changed();
    }

    damage_player(amount : number, death_info_handler : () => IDeathHandlerInfo, attacker? : ServerPlayer) : boolean {
        const killed = super.damage_player(amount, death_info_handler, attacker);
        this.world.broadcast_packet(PacketNames.replicate_player_damaged, (attacker ? attacker.uuid : null), this.uuid, amount);

        if (killed) {
          this.replicate__death(death_info_handler());
        }

        return killed;
    }

    update(update_evt : IUpdate) {
        this.world.wrapped_queue_packets(() => {
            super.update(update_evt);
        });
    }

    spawn() {
        super.spawn();
        this.replicate__movementstate_changed(true);
    }

    rush(direction_enum_value : RushDirections) {
        super.rush(direction_enum_value);
        this.replicate__movementstate_changed(false);

    }

    generate_weapon(index : number) {
        return new ServerWeapon(this);
    }

    activate_powerup() {
        super.activate_powerup();
        this.replicate__powerup_state();
    }
}

export interface IPacket {
    evt_name : PacketNames,
    args : any[]
}