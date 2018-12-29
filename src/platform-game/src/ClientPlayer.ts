import { Player } from "../../helpers-common/Player";
import { CanvasApplication, CanvasSubApplication } from "../../helpers-client/CanvasApplication";
import Vector from "../../helpers-common/helpers/Vector";
import { rainbow_color } from "../../helpers-client/color";
import { MAX_HEALTH } from "../../config/Config";
import { ClientWorld } from "./ClientWorld";
import { AmmoParticle, BloodParticle } from "./Particles";
import { World } from "../../helpers-common/World";

export class ClientPlayer extends Player<ClientWorld> {
    public gun_look_direction : Vector = null;

    constructor(world : ClientWorld, name : string) {
        super(world, name);
    }

    particlehandle__damaged(damage : number) {
        for (let x = 0; x < damage * 2; x++) {
            this.world.particle_system.register_particle(new BloodParticle(
                this.world.particle_system, this.world.app,
                this.collision_rect.point_middle(), new Vector(Math.random() - 0.5, -Math.random()).mult(new Vector(15)), Math.floor(Math.random() * 10 + 5)
            ));
        }

        if (this.health - damage <= 0) {
            for (let x = 0; x < 20; x++) {
                this.world.particle_system.register_particle(new AmmoParticle(
                    this.world.particle_system, this.world.app,
                    this.collision_rect.point_middle(), new Vector(Math.random() - 0.5, -Math.random()).mult(new Vector(15)))
                );
            }
        }
    }

    particlehandle__player_shoot_bullet(origin : Vector, direction : Vector) {
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

            this.collision_rect.fill_rect(ctx);
            this.collision_rect.stroke_rect(ctx);
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
                ctx.globalAlpha = 1 - (this.get_active_weapon().get_pullup_cooldown() / this.get_active_weapon().get_pullup_cooldown_max());
    
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