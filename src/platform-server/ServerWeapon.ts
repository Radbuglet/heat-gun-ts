import { Weapon, ITrait } from "../helpers-common/Weapon";
import { ServerPlayer } from "./ServerPlayer";
import { ServerWorld } from "./ServerWorld";
import Vector from "../helpers-common/helpers/Vector";

export class ServerWeapon extends Weapon<ServerWorld, ServerPlayer, ServerWeapon> {
    upgrade_trait(trait: ITrait) : boolean {
        const did_change = super.upgrade_trait(trait);

        if (did_change) {
            this.player.world.wrapped_queue_packets(() => {
                this.player.replicate__energy_changed();
                this.player.replicate__weaponinfo_changed();
            });
        }
        
        return did_change;
    }

    downgrade_trait(trait: ITrait) : boolean {
        const did_change = super.downgrade_trait(trait);

        if (did_change) {
            this.player.world.wrapped_queue_packets(() => {
                this.player.replicate__energy_changed();
                this.player.replicate__weaponinfo_changed();
            });
        }

        return did_change;
    }

    apply_forces(aim_direction : Vector, already_verified_teleport = false) {
        super.apply_forces(aim_direction, already_verified_teleport);

        this.player.replicate__movementstate_changed(false);
    }

    shoot(aim_direction : Vector) {
        this.player.world.queue_all_players_packets();
        const result = super.shoot(aim_direction);

        if (result.did_shoot) {
            if (result.damaged_player !== null) {
                result.damaged_player.replicate__movementstate_changed(true);
                this.player.replicate__energy_changed();
            }
        }
        
        this.player.world.unqueue_all_players_packets();

        return result;
    }
}