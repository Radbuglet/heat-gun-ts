import { Weapon } from "./Weapon";
import { World } from "./World";
import { Player } from "./Player";
import {v4 as uuidv4} from "uuid";
import { Rect } from "./helpers/Rect";
import Vector from "./helpers/Vector";
import { IUpdate } from "./helpers/IUpdate";
import { POWERUP_MINDIST } from "../config/Config";
import { IPowerUpType, power_up_types, PowerUpTypes } from "./PowerUpTypes";
import { randint } from "./helpers/Math";

export class PowerUpCrystal<TWorld extends World<TWorld, TPlayer, TWeapon, TCrystal>, TPlayer extends Player<TWorld, TPlayer, TWeapon, TCrystal>, TWeapon extends Weapon<TWorld, TPlayer, TWeapon, TCrystal>, TCrystal extends PowerUpCrystal<TWorld, TPlayer, TWeapon, TCrystal>> {
    public uuid : string = uuidv4();
    public collision_rect : Rect = new Rect(new Vector(0, 0), new Vector(100, 150));
    public powerup_type : PowerUpTypes = null;

    constructor(public world : TWorld) {
        this.spawn();
    }

    update(evt : IUpdate) {
        // (All checks are performed by the player because a powerup deleting itself is wierd)
    }

    get_power_up_type_info() : IPowerUpType {
        return power_up_types.get(this.powerup_type);
    }

    spawn() {
        const powerup_types_array = Array.from(power_up_types.keys());
        this.powerup_type = powerup_types_array[randint(0, powerup_types_array.length - 1)];

        while (true) {
            this.world.spawn_rect(this.collision_rect);

            if (Array.from(this.world.powerup_crystals.values())
                .filter(other_crystal => other_crystal.collision_rect.point_middle().distance(this.collision_rect.point_middle()) <= POWERUP_MINDIST).length > 0) continue;
            
            break;
        }
    }
}