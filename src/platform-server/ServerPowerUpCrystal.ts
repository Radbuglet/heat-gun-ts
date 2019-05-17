import { PowerUpCrystal } from "../helpers-common/PowerUpCrystal";
import { ServerWorld } from "./ServerWorld";
import { ServerPlayer } from "./ServerPlayer";
import { ServerWeapon } from "./ServerWeapon";

export class ServerPowerUpCrystal extends PowerUpCrystal<ServerWorld, ServerPlayer, ServerWeapon, ServerPowerUpCrystal> {
    serialize() {
        return [
            this.collision_rect.top_left.serialize(),
            this.powerup_type.toString()
        ];
    }
}