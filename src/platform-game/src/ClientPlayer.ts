import { Player } from "../../helpers-common/Player";
import { CanvasApplication, CanvasSubApplication } from "../../helpers-client/CanvasApplication";
import Vector from "../../helpers-common/helpers/Vector";
import { rainbow_color } from "../../helpers-client/color";
import { MAX_HEALTH } from "../../config/Config";
import { ClientWorld } from "./ClientWorld";
import { AmmoParticle } from "../../helpers-client/ParticleSystem";
import { ITrait, configurable_traits } from "../../helpers-common/Weapon";

export class ClientPlayer extends Player<ClientWorld> {
    public gun_look_direction : Vector = null;

    constructor(world : ClientWorld, name : string) {
        super(world, name);
    }

    handle_death() {}
    handle_energy_changed() {}
    handle_health_changed() {}
    handle_movementstate_changed() {}
    handle_powerupstate_changed() {}
    handle_slot_changed() {}
    handle_player_shoot_gun(origin : Vector, direction : Vector) {
        this.world.particle_system.register_particle(new AmmoParticle(
            this.world.particle_system, this.world.app,
            origin, direction.mult(new Vector(10))
        ));
    }

    send_message() {}

    render(app : CanvasSubApplication) {
        app.draw(ctx => {
            ctx.fillStyle = this.get_movement_collisions(new Vector(0, 0)).length > 0 ? "red" : "gold";
            ctx.strokeStyle = "darkred";

            ctx.fillRect(
                this.collision_rect.get_x(), this.collision_rect.get_y(),
                this.collision_rect.get_width(), this.collision_rect.get_height());
            
            ctx.strokeRect(
                this.collision_rect.get_x(), this.collision_rect.get_y(),
                this.collision_rect.get_width(), this.collision_rect.get_height()
            );
        });

        app.draw(ctx => {
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            const player_top_middle = this.collision_rect.get_point(0.5, 0);
            
            app.draw(() => {
                ctx.font = "15px monospace";
                ctx.fillStyle = rainbow_color({ time_div: 20, saturation: 100, light: 30 })
                ctx.fillText(this.name, player_top_middle.getX(), player_top_middle.getY() - 20);
            });

            app.draw(() => {
                ctx.font = "15px monospace";
                ctx.fillStyle = "#000";
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 0.3;
                
                const health_str = this.health + "/" + MAX_HEALTH + " hp";
                ctx.fillText(health_str, player_top_middle.getX(), player_top_middle.getY() - 40);
                ctx.strokeText(health_str, player_top_middle.getX(), player_top_middle.getY() - 40);
            });
        });

        if (this.gun_look_direction !== null) {
            app.draw(ctx => {
                const gun_start = this.collision_rect.point_middle().sub(
                    this.gun_look_direction.mult(new Vector(this.get_active_weapon().shot_cooldown))
                );
                ctx.lineWidth = 10;
    
                app.draw(() => {
                    ctx.strokeStyle = "#aaa";
                    ctx.beginPath();
                    ctx.moveTo(gun_start.getX(), gun_start.getY());
                    ctx.lineTo(gun_start.getX() + this.gun_look_direction.getX() * 30, gun_start.getY() + this.gun_look_direction.getY() * 30);
                    ctx.stroke();
                });
    
                app.draw(() => {
                    ctx.lineWidth = 7;
                    ctx.strokeStyle = "#ccc";
                    ctx.beginPath();
                    ctx.moveTo(gun_start.getX(), gun_start.getY());
                    ctx.lineTo(gun_start.getX() + this.gun_look_direction.getX() * 30, gun_start.getY() + this.gun_look_direction.getY() * 30);
                    ctx.stroke();
                });
    
                app.draw(() => {
                    ctx.strokeStyle = "#000";
                    ctx.beginPath();
                    ctx.moveTo(gun_start.getX(), gun_start.getY());
                    ctx.lineTo(gun_start.getX() + this.gun_look_direction.getX() * 10, gun_start.getY() + this.gun_look_direction.getY() * 10);
                    ctx.stroke();
                });
            });
        }
    }
}