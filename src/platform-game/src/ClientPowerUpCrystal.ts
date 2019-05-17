import { PowerUpCrystal } from "../../helpers-common/PowerUpCrystal";
import { ClientWorld } from "./ClientWorld";
import { ClientPlayer } from "./ClientPlayer";
import { ClientWeapon } from "./ClientWeapon";
import { CanvasSubApplication } from "../../helpers-client/CanvasApplication";

export class ClientPowerUpCrystal extends PowerUpCrystal<ClientWorld, ClientPlayer, ClientWeapon, ClientPowerUpCrystal> {
    constructor(world : ClientWorld) {
        super(world);
    }

    render(app : CanvasSubApplication) {
        app.draw(ctx => {
            ctx.fillStyle = this.get_power_up_type_info().color;
            this.collision_rect.fill_rect(ctx);
        });
    }
}