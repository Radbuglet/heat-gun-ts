import { Player } from "./Player";
import { IUpdate } from "./helpers/IUpdate";
import Vector from "./helpers/Vector";
import { BeamRaycaster } from "./BeamRaycaster";
import { num_in_range, clamp_num } from "./helpers/Math";
import { WEAPONS_HELD, AIM_MAGNITUDE_DIST_MIN, AIM_MAGNITUDE_DIST_MAX } from "../config/Config";
import { ServerWorld } from "../platform-server/ServerWorld";
import { ServerPlayer } from "../platform-server/ServerPlayer";
import { ClientPlayer } from "../platform-game/src/ClientPlayer";
import { World } from "./World";

export interface IWeaponStats {
    additional_ground_ammo: number
    additional_barrels: number
    additional_callibur: number
    additional_size: number
    additional_launching_power: number
    suck_mode: number
    bullet_gravity: number
    scope: number
    trail_color: number
    teleportation: number
    fire_rate: number
    gravmod: number
    fricmod : number
    slow_motion : number
    slot_on_shoot : number

    kb_reverse : number
    kb_increase : number
}

export interface IWeapon {
    ammo: number
    conf: IWeaponStats
}

export interface ITrait {
    name: string
    cost: number
    maxval: number
    key: string
    
    filter_id : string
    unfiltered_index? : number
}

export interface ITraitCategory {
    name : string,
    filter_identifier : string
}

export const configurable_traits : ITrait[] = [
    {
        key: "additional_ground_ammo",
        name: "Additional ammo",
        maxval: 4,
        cost: 3,
        filter_id: "gun"
    },
    {
        key: "additional_callibur",
        name: "Additional callibur",
        maxval: 7,
        cost: 4,
        filter_id: "gun"
    },
    {
        key: "fire_rate",
        name: "Faster Fire",
        maxval: 4,
        cost: 3,
        filter_id: "gun"
    },
    {
        key: "additional_barrels",
        name: "Additional Barrels",
        maxval: 3,
        cost: 10,
        filter_id: "gun"
    },

    {
        key: "gravmod",
        name: "Gravity--",
        maxval: 4,
        cost: 2,
        filter_id: "mov"
    },
    {
        key: "fricmod",
        name: "Friction--",
        maxval: 4,
        cost: 2,
        filter_id: "mov"
    },
    {
        key: "additional_launching_power",
        name: "Additional proppelling",
        maxval: 5,
        cost: 2,
        filter_id: "mov"
    },
    {
        key: "slow_motion",
        name: "Slow Motion",
        maxval: 4,
        cost: 3,
        filter_id: "mov"
    },
    {
        key: "suck_mode",
        name: "Reverse Direction",
        maxval: 1,
        cost: 5,
        filter_id: "mov"
    },

    {
        key: "additional_size",
        name: "Bigger bullet size",
        maxval: 5,
        cost: 3,
        filter_id: "bul"
    },
    {
        key: "bullet_gravity",
        name: "Bullet Gravity",
        maxval: 5,
        cost: 2,
        filter_id: "bul"
    },
    {
        key: "trail_color",
        name: "Trail Color",
        maxval: 10,
        cost: 0,
        filter_id: "bul"
    },

    {
        key: "kb_reverse",
        name: "Reversed Knockback",
        maxval: 1,
        cost: 10,
        filter_id: "kb"
    },
    {
        key: "kb_increase",
        name: "Increased Knockback",
        maxval: 4,
        cost: 3,
        filter_id: "kb"
    },

    {
        key: "scope",
        name: "Scope",
        maxval: 7,
        cost: 0,
        filter_id: "misc"
    },
    {
        key: "teleportation",
        name: "Teleportation",
        maxval: 4,
        cost: 3,
        filter_id: "misc"
    },
    {
        key: "slot_on_shoot",
        name: "Shot slot change (0 = disabled)",
        maxval: 3,
        cost: 0,
        filter_id: "misc"
    }
];

configurable_traits.forEach((trait, i) => {
    trait.unfiltered_index = i;
});

export const trait_categories : ITraitCategory[] = [
    {
        name: "All Upgrades",
        filter_identifier: null
    },
    {
        name: "Gun Upgrades",
        filter_identifier: "gun"
    },
    {
        name: "Movement Upgrades",
        filter_identifier: "mov"
    },
    {
        name: "Bullet Upgrades",
        filter_identifier: "bul"
    },
    {
        name: "Knock-back Upgrades",
        filter_identifier: "kb"
    },
    {
        name: "Misc",
        filter_identifier: "misc"
    }
];

export class Weapon<TWorld extends World<TWorld, TPlayer, TWeapon>, TPlayer extends Player<TWorld, TPlayer, TWeapon>, TWeapon extends Weapon<TWorld, TPlayer, TWeapon>> {
    public replicated_data: IWeapon = {
        ammo: 2,
        conf: {
            additional_barrels: 0,
            additional_callibur: 0,
            additional_ground_ammo: 0,
            additional_launching_power: 0,
            additional_size: 0,
            bullet_gravity: 0,
            fire_rate: 0,
            gravmod: 0,
            scope: 0,
            suck_mode: 0,
            teleportation: 0,
            trail_color: 0,
            fricmod: 0,
            slow_motion: 0,
            slot_on_shoot: 0,
            kb_increase: 0,
            kb_reverse: 0
        }
    }

    public shot_cooldown : number = 0;

    constructor(public player: TPlayer) {

    }

    get_upgrades(): IWeaponStats {
        return this.replicated_data.conf;
    }
    
    get_active_upgrades() : ITrait[] {
        return configurable_traits.filter(trait_info => trait_info !== null && this.get_upgrades()[trait_info.key] > 0);
    }

    get_max_ammo(): number {
        return 2 + this.get_upgrades().additional_ground_ammo;
    }

    set_ammo(ammo: number) {
        this.replicated_data.ammo = ammo;
    }

    get_ammo(): number {
        return this.replicated_data.ammo;
    }

    get_firerate_multiplier(is_for_pistol : boolean): number {
        return 1 - (this.get_upgrades().fire_rate * (is_for_pistol ? 0.1 : 0.2));
    }

    get_trait_value(trait: ITrait): number {
        return this.get_upgrades()[trait.key];
    }

    change_trait_value(trait: ITrait, dt: number) {
        this.get_upgrades()[trait.key] += dt;
    }

    is_trait_maxed_out(trait: ITrait): boolean {
        return this.get_trait_value(trait) >= trait.maxval;
    }

    upgrade_trait(trait: ITrait) : boolean {
        if (this.player.energy >= trait.cost && !this.is_trait_maxed_out(trait)) {
            this.player.energy -= trait.cost;
            this.change_trait_value(trait, 1);

            return true;
        }

        return false;
    }

    downgrade_trait(trait: ITrait) {
        if (this.get_trait_value(trait) > 0) {
            this.player.energy += trait.cost;
            this.change_trait_value(trait, -1);

            return true;
        }

        return false;
    }

    get_next_slot() : number {
        return this.get_upgrades().slot_on_shoot > 0 ? this.get_upgrades().slot_on_shoot - 1 : null;
    }

    update(update_evt: IUpdate) {
        if (this.player.is_on_ground()) {
            this.set_ammo(this.get_max_ammo());
        }

        if (this.has_shot_cooldown()) {
            this.shot_cooldown -= update_evt.ticks * 1.2;

            if (this.shot_cooldown < 0) this.shot_cooldown = 0;
        }
    }

    has_shot_cooldown() : boolean {
        return this.shot_cooldown > 0;
    }

    can_shoot() {
        return !this.has_shot_cooldown() && this.get_ammo() > 0 && this.player.gun_pullup_cooldown === 0;
    }

    get_pullup_cooldown() : number {
        return this.player.gun_pullup_cooldown;
    }

    get_pullup_cooldown_max() : number {
        return Math.floor(10 + (this.get_upgrades().additional_callibur * 5) + (this.get_upgrades().additional_barrels * 5));
    }

    get_cooldown_when_shooting() : number {
        return Math.floor(
            (
                (15 * this.get_firerate_multiplier(true)) +
                (
                    (this.get_upgrades().additional_callibur * 12) +
                    (this.get_upgrades().additional_barrels * 100)
                ) * this.get_firerate_multiplier(false)
            ) + (
                (this.get_upgrades().teleportation * 15)
            )
        );
    }

    raycast_beam(bullet_direction : Vector, aim_magnitude : number, chk_every = 1) {
        const raycaster = new BeamRaycaster({
            starting_position: this.player.collision_rect.point_middle(),
            starting_direction: bullet_direction,
            phase_world: false,

            max_dist: this.get_max_dist(), // @TODO calculate
            ray_collision_box_size: new Vector(this.get_bullet_size()),

            gravity_vec: new Vector(0, 
                Math.max((this.get_upgrades().bullet_gravity * 0.5 - (this.get_upgrades().additional_callibur * 0.1)), 0) / 1000
                //10
            ),
            path_diff_until_change: 0.25,
            
            world: this.player.world,
            initiator_player: this.player,
            chk_every
        });

        raycaster.raycast();
        return raycaster;
    }
    
    get_max_dist() : number {
        return Math.max(1000 + (this.get_upgrades().additional_callibur * 200) - (this.get_upgrades().additional_barrels * 75), 100) + (this.get_upgrades().bullet_gravity * 200);
    }

    get_damage() : number {
        return Math.round(Math.max(
            (4 * this.get_firerate_multiplier(true))
            +
            (
                ((this.get_upgrades().additional_callibur * 2) + (this.get_upgrades().additional_barrels * 10))
                / (this.get_upgrades().additional_barrels + 1)
            ) * this.get_firerate_multiplier(true), 3));
    }

    is_selected() : boolean {
        return this as unknown as TWeapon === this.player.get_active_weapon();
    }

    shoot(aim_direction : Vector, aim_magnitude : number) : IShotResult<TWorld, TPlayer, TWeapon> {
        const shot_result : IShotResult<TWorld, TPlayer, TWeapon> = {
            did_shoot: false,
            damage_amount: null,
            damaged_player: null,
            energy_gained: null
        };

        if (!this.can_player_teleport(aim_direction)) return shot_result;
        shot_result.did_shoot = true;

        this.apply_forces(aim_direction, true);
        this.shot_cooldown = this.get_cooldown_when_shooting();
        this.set_ammo(this.get_ammo() - 1);

        if (this.player.world.simulation_permissions.can_perform_next_slot_select && this.get_next_slot() !== null) {
            this.player.select_slot(this.get_next_slot());
        }

        for (let i = 0; i < this.get_upgrades().additional_barrels + 1; i++) {
            const direction_innac : number = (Math.random() - 0.5) * (this.get_upgrades().additional_barrels / 5);
            const bullet_direction = new Vector(
                Math.sin(aim_direction.getrad() + direction_innac),
                Math.cos(aim_direction.getrad() + direction_innac)
            );
            
            const raycaster = this.raycast_beam(bullet_direction, aim_magnitude);
            if (raycaster.collided_player !== null) {
                const damaged_player : TPlayer = raycaster.collided_player;
                const attacker = this.player;
                
                const damage = this.get_damage();
                shot_result.damaged_player = damaged_player;
                shot_result.damage_amount = damage;
                    
                damaged_player.velocity.copyOther(bullet_direction.mult(new Vector(35 + this.get_upgrades().kb_increase * 5)).add(new Vector(0, -20)));
                if (this.get_upgrades().kb_reverse === 1) {
                    damaged_player.velocity.setX(damaged_player.get_launching_velocity_for(attacker.position).getX() * 0.8);
                    //damaged_player.velocity.setY((damaged_player.position.getY() - attacker.position.getY()) * (5 + this.get_upgrades().kb_increase * 5));
                    damaged_player.velocity.copyOther(damaged_player.velocity.normalized().mult(new Vector(Math.min(damaged_player.velocity.len(), 50 + this.get_upgrades().kb_increase * 50))));
                }

                if (this.player.world.simulation_permissions.can_perform_shot_damage) {
                    damaged_player.send_message([{
                        color: "red",
                        text: attacker.name
                      }, {
                        color: "darkred",
                        text: " did "
                      },
                      {
                        color: "red",
                        text: (Math.floor(damage * 10) / 10).toString()
                      },
                      {
                        color: "darkred",
                        text: " damage to you!"
                      }
                    ]);

                    const gained_energy = damage / 4;
                    shot_result.energy_gained = gained_energy;

                    this.player.send_message([{
                        color: "darkgreen",
                        text: "You gained "
                      },
                      {
                        color: "green",
                        text: (Math.floor(gained_energy * 10) / 10).toString()
                      },
                      {
                        color: "darkgreen",
                        text: " energy!"
                      },
                      {
                        color: "red",
                        text: " Damage dealt: " + Math.floor(damage * 10) / 10
                      }
                    ]);
                    
                    damaged_player.damage_player(damage, () => {
                        return {
                            personal_message: [
                                {
                                    color: "red",
                                    text: "You were killed by "
                                },
                                {
                                    color: "black",
                                    text: attacker.name
                                },
                                {
                                    color: "red",
                                    text: ". Your score was "
                                },
                                {
                                    color: "black",
                                    text: damaged_player.total_energy.toString()
                                }

                            ],
                            public_message: [{
                                color: "darkred",
                                text: damaged_player.name
                              },
                              {
                                color: "#ee1a1a",
                                text: " was killed by " + attacker.name
                              }
                            ]
                        }
                    }, attacker);
    
                    attacker.energy += gained_energy;
                    attacker.total_energy += gained_energy;
                }
            }

            this.player.world.add_gun_beams(
                this.player,
                raycaster.beam_path,
                this.get_bullet_size(),
                this.get_beam_color()
            );
        }

        return shot_result;
    }

    get_beam_color() {
        return `hsl(${(this.get_upgrades().trail_color / 10) * 360}, 90%, 50%)`;
    }

    get_bullet_size() {
        return 10 + this.get_upgrades().additional_size * 3;
    }

    apply_forces(aim_direction : Vector, already_verified_teleport = false) {
        const is_grounded = this.player.is_on_ground();
        const tpvec = this.get_teleportation_vec(aim_direction);

        if (already_verified_teleport || this.can_teleport_tpvec(tpvec)) this.player.position.mutadd(tpvec);

        this.player.velocity = aim_direction.mult(
            new Vector(is_grounded ? 40 : 30).add(new Vector(this.get_upgrades().additional_launching_power * 2.5))
        ).negate();

        if (this.get_upgrades().teleportation > 0) {
            this.player.velocity.mutnegate();
        }

        if (this.get_upgrades().suck_mode > 0) {
            this.player.velocity.mutnegate();
        }
    }

    can_teleport_tpvec(tp_vec : Vector) {
        return this.player.get_movement_collisions(tp_vec).length === 0;
    }

    can_player_teleport(aim_direction : Vector) {
        return this.can_teleport_tpvec(this.get_teleportation_vec(aim_direction));
    }

    get_teleportation_vec(aim_direction : Vector) : Vector {
        const tpvec = aim_direction.mult(new Vector(this.get_upgrades().teleportation * 100));
        if (this.get_upgrades().suck_mode > 0) {
            tpvec.mutnegate();
        }
        return tpvec;
    }

    static is_valid_slot_index(slot : number) : boolean {
        return num_in_range(0, slot, WEAPONS_HELD - 1);
    }

}

interface IShotResult<TWorld extends World<TWorld, TPlayer, TWeapon>, TPlayer extends Player<TWorld, TPlayer, TWeapon>, TWeapon extends Weapon<TWorld, TPlayer, TWeapon>> {
    did_shoot : boolean,
    damaged_player : TPlayer,
    damage_amount : number,
    energy_gained : number
}