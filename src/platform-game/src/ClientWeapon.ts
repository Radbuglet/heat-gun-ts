import { Weapon } from "../../helpers-common/Weapon";
import { ClientWorld } from "./ClientWorld";
import { ClientPlayer } from "./ClientPlayer";
import Vector from "../../helpers-common/helpers/Vector";

export class ClientWeapon extends Weapon<ClientWorld, ClientPlayer, ClientWeapon> {
    constructor(player : ClientPlayer, public theme_color : string) {
        super(player);
    }

    shoot(aim_direction : Vector) {
        const result = super.shoot(aim_direction);
        if (result.did_shoot) {
            this.player.particlehandle__player_shoot_bullet(this.player.collision_rect.point_middle(), aim_direction.clone());
        }

        return result;
    }
}
