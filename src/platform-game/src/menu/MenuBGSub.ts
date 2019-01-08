import { CanvasSubApplication } from "../../../helpers-client/CanvasApplication";
import { Rect } from "../../../helpers-common/helpers/Rect";
import Vector from "../../../helpers-common/helpers/Vector";
import { MainGame } from "../entry";
import { CloudHorizon } from "../CloudHorizon";
import { ClientWorld } from "../ClientWorld";
import { MapLoader } from "../../../helpers-common/MapLoader";
import { Camera } from "../../../helpers-client/Camera";
import { TPZONE_LEFT, TPZONE_TOP, TPZONE_RIGHT, TPZONE_BOTTOM } from "../../../config/Config";

export abstract class MenuBGSub extends CanvasSubApplication {
    private cloud_horizon : CloudHorizon = new CloudHorizon(this);

    private camera : Camera = new Camera(new Vector(0, 0), this);
    private world : ClientWorld;

    constructor(main_app : MainGame, map_loader : MapLoader) {
        super(main_app);
        this.world = new ClientWorld(map_loader, this);
    }

    app_update(dt : number, ticks_passed : number) {
        this.world.update({
            delta: dt, ticks: ticks_passed, total_ms: 0, total_ticks: 0
        });
    }

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number) {
        // Background Grid
        this.cloud_horizon.draw();

        // Map preview
        const target_lookvec = Rect.from_positions(new Vector(TPZONE_LEFT, TPZONE_TOP), new Vector(TPZONE_RIGHT, TPZONE_BOTTOM)).get_percent_margin_rect(0.2).get_point(
            this.get_mouse_position().getX() / width,
            this.get_mouse_position().getY() / height
        );
        const mov_avg_resistance = 3;
        this.camera.lookvec = target_lookvec.mult(new Vector(mov_avg_resistance)).add(this.camera.lookvec).div(new Vector(1 + mov_avg_resistance));

        this.camera.setZoom(0.9);

        this.camera.attach();
        this.world.render_particles();
        this.world.render_beams();
        this.world.players.forEach(player => player.render(this));
        this.world.render_world(this.camera.get_view_rect(), null, null, null);
        this.world.render_bounding_box();
        this.camera.dettach();
    }
}