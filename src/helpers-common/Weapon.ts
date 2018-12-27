import { Player } from "./Player";
import { IUpdate } from "./helpers/IUpdate";
import Vector from "./helpers/Vector";
import { BeamRaycaster } from "./BeamRaycaster";
import { num_in_range } from "./helpers/Math";
import { WEAPONS_HELD } from "../config/Config";
import { RunPlatform } from "./helpers/RunPlatform";
import { ServerWorld } from "../platform-server/ServerWorld";
import { ServerPlayer } from "../platform-server/ServerPlayer";
import { ClientPlayer } from "../platform-game/src/ClientPlayer";

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
}

export const configurable_traits: ITrait[] = [
    {
        key: "additional_ground_ammo",
        name: "Additional ammo",
        maxval: 4,
        cost: 3
    },
    {
        key: "additional_callibur",
        name: "Additional callibur",
        maxval: 7,
        cost: 4
    },
    {
        key: "fire_rate",
        name: "Faster Fire",
        maxval: 4,
        cost: 3,
    },
    {
        key: "additional_barrels",
        name: "Additional Barrels",
        maxval: 3,
        cost: 10
    },

    null,

    {
        key: "gravmod",
        name: "Gravity--",
        maxval: 4,
        cost: 2
    },
    {
        key: "fricmod",
        name: "Friction--",
        maxval: 4,
        cost: 2
    },
    {
        key: "additional_launching_power",
        name: "Additional proppelling",
        maxval: 5,
        cost: 2
    },
    {
        key: "slow_motion",
        name: "Slow Motion",
        maxval: 4,
        cost: 3
    },
    {
        key: "suck_mode",
        name: "Reverse Direction",
        maxval: 1,
        cost: 5
    },

    null,

    {
        key: "additional_size",
        name: "Bigger bullet size",
        maxval: 5,
        cost: 3
    },
    {
        key: "bullet_gravity",
        name: "Bullet Gravity",
        maxval: 5,
        cost: 2
    },
    {
        key: "trail_color",
        name: "Trail Color",
        maxval: 10,
        cost: 0
    },

    null,

    {
        key: "scope",
        name: "Scope",
        maxval: 7,
        cost: 0
    },
    {
        key: "teleportation",
        name: "Teleportation",
        maxval: 4,
        cost: 3
    },
    {
        key: "slot_on_shoot",
        name: "Shot slot change (0 = disabled)",
        maxval: 3,
        cost: 0
    }
];

export class Weapon {
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
            slot_on_shoot: 0
        }
    }

    public shot_cooldown : number = 0;

    constructor(public player: Player<any>, public theme_color : string) {

    }

    get_upgrades(): IWeaponStats {
        return this.replicated_data.conf;
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

    upgrade_trait(trait: ITrait) {
        if (this.player.energy >= trait.cost && !this.is_trait_maxed_out(trait)) {
            this.player.energy -= trait.cost;
            this.change_trait_value(trait, 1);

            if (RunPlatform.is_server()) {
                (this.player.world as unknown as ServerWorld).queue_all_players_packets();
                (this.player as unknown as ServerPlayer).replicate__energy_changed();
                (this.player as unknown as ServerPlayer).replicate__weaponinfo_changed();
                (this.player.world as unknown as ServerWorld).unqueue_all_players_packets();
            }
        }
    }

    downgrade_trait(trait: ITrait) {
        if (this.get_trait_value(trait) > 0) {
            this.player.energy += trait.cost;
            this.change_trait_value(trait, -1);

            if (RunPlatform.is_server()) {
                (this.player.world as unknown as ServerWorld).queue_all_players_packets();
                (this.player as unknown as ServerPlayer).replicate__energy_changed();
                (this.player as unknown as ServerPlayer).replicate__weaponinfo_changed();
                (this.player.world as unknown as ServerWorld).unqueue_all_players_packets();
            }
        }
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
        return 10 + (this.get_upgrades().additional_callibur * 5) + (this.get_upgrades().additional_barrels * 5);
    }

    is_selected() {
        return this === this.player.get_active_weapon();
    }

    get_cooldown_when_shooting() : number {
        return (
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

    raycast_beam(bullet_direction : Vector, chk_every = 1) {
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

    shoot(aim_direction : Vector) {
        if (RunPlatform.is_server()) (this.player.world as ServerWorld).queue_all_players_packets();

        if (!this.can_player_teleport(aim_direction)) return;

        this.apply_forces(aim_direction, true);
        this.shot_cooldown = this.get_cooldown_when_shooting();
        this.set_ammo(this.get_ammo() - 1);

        if (RunPlatform.is_client() && this.get_next_slot() !== null) {
            this.player.select_slot(this.get_next_slot());
        }

        for (let i = 0; i < this.get_upgrades().additional_barrels + 1; i++) {
            const direction_innac : number = (Math.random() - 0.75) * ((this.get_upgrades().additional_barrels + this.get_upgrades().additional_size * 0.025) / 5);
            const bullet_direction = new Vector(
                Math.sin(aim_direction.getrad() + direction_innac),
                Math.cos(aim_direction.getrad() + direction_innac)
            );
            
            const raycaster = this.raycast_beam(bullet_direction);
            if (RunPlatform.is_client()) (this.player as unknown as ClientPlayer).particlehandle__player_shoot_bullet(this.player.collision_rect.point_middle(), bullet_direction);
            if (raycaster.collided_player !== null) {
                const damaged_player = raycaster.collided_player;
                const attacker = this.player;
                
                const damage = Math.ceil(Math.max(
                    (4 * this.get_firerate_multiplier(false))
                    +
                    (
                        ((this.get_upgrades().additional_callibur * 2) + (this.get_upgrades().additional_barrels * 7))
                        / (this.get_upgrades().additional_barrels + 1)
                    ) * this.get_firerate_multiplier(false), 3));
                
                if (RunPlatform.is_client()) (damaged_player as unknown as ClientPlayer).particlehandle__damaged(damage);
                    
                damaged_player.velocity.copyOther(bullet_direction.mult(new Vector(35)).add(new Vector(0, -20)));
                
                if (RunPlatform.is_server()) (damaged_player as unknown as ServerPlayer).replicate__movementstate_changed(true);

                if (RunPlatform.is_server()) {
                    const damaged_player_server = damaged_player as unknown as ServerPlayer;
                    const attacker_player_server = attacker as unknown as ServerPlayer;

                    damaged_player_server.send_message([{
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

                    attacker_player_server.send_message([{
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
                    attacker_player_server.replicate__energy_changed();
                }
            }

            this.player.world.add_gun_beams(
                this.player,
                raycaster.beam_path,
                this.get_bullet_size(),
                this.get_beam_color()
            );
        }

        if (RunPlatform.is_server()) (this.player.world as ServerWorld).unqueue_all_players_packets();
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

        if (RunPlatform.is_server()) (this.player as unknown as ServerPlayer).replicate__movementstate_changed(false);
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