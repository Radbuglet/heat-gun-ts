import Vector from "./helpers/Vector";
import {
  MAX_HEALTH,
  DEFAULT_ENERGY,
  TPZONE_TOP,
  TPZONE_BOTTOM,
  TPZONE_LEFT,
  TPZONE_RIGHT,
  PLAYER_COLLISION_BOX,
  MAX_ROLLBACK_POSITIONS_ALLOWED,
  WEAPONS_HELD 
} from "../config/Config";
import {
  Weapon
} from "./Weapon";
import { World } from "./World";
import {v4 as uuidv4} from "uuid";
import { IUpdate } from "./helpers/IUpdate";
import { ServerPosRollbacker } from "./helpers/ServerSyncPosController";
import { Rect } from "./helpers/Rect";
import { ITextComponent } from "./helpers/ITextComponent";
import { RushDirections } from "./RushDirections";
import { ITile } from "./MapLoader";
import { clamp_num } from "./helpers/Math";

export abstract class Player<TWorld extends World<TWorld, TPlayer, TWeapon>, TPlayer extends Player<TWorld, TPlayer, TWeapon>, TWeapon extends Weapon<TWorld, TPlayer, TWeapon>> {
  public position: Vector = new Vector(10, 10);
  public velocity: Vector = new Vector(0, 0);
  public using_scope: boolean = false;
  public can_use_rush: boolean = true;
  public chat_log : ITextComponent[][] = [];

  public health: number = MAX_HEALTH;

  public energy: number = DEFAULT_ENERGY;
  public total_energy: number = DEFAULT_ENERGY;

  private selected_slot: number = 0;
  public gun_pullup_cooldown : number = 0;

  private regen_timer : number = 0;

  public weapons : TWeapon[] = [];
  public uuid : string;
  private sync_controller = new ServerPosRollbacker(MAX_ROLLBACK_POSITIONS_ALLOWED);
  public collision_rect : Rect;

  constructor(public world : TWorld, public name: string) {
    this.uuid = uuidv4();
    this.collision_rect = new Rect(this.position, PLAYER_COLLISION_BOX);
    
    this.weapons = new Array(WEAPONS_HELD).fill(null).map((_, i) => this.generate_weapon(i));
  }

  get_active_weapon() : TWeapon {
    return this.weapons[this.selected_slot];
  }

  get_selected_slot() : number {
    return this.selected_slot;
  }

  select_slot(slot : number) : boolean {
    if (this.selected_slot !== slot) {
      this.selected_slot = slot;
      this.gun_pullup_cooldown = this.get_active_weapon().get_pullup_cooldown_max();
    }

    return this.selected_slot !== slot;
  }

  get_movement_collisions(vec : Vector, return_raw_collisions = false) : ITile[] {
    return this.world.get_movement_collisions(this.collision_rect, vec, return_raw_collisions);
  }

  is_on_ground() : boolean {
    // @TODO create get_gravity_force and use it in this file instead of this evil hardcoding.
    if (this.collision_rect.point_bottom_left().getY() + 1 >= TPZONE_BOTTOM) return true;
    return this.get_movement_collisions(new Vector(0, this.get_active_weapon().get_upgrades().gravmod > 1 ? -1 : 1)).length !== 0;
  }

  get_gravity_force() : number {
    return 1.7 - this.get_active_weapon().get_upgrades().gravmod * 0.7;
  }

  get_friction_coef() : number {
    return 0.85 + this.get_active_weapon().get_upgrades().fricmod * 0.025;
  }

  rush(direction_enum_value : RushDirections) {
    const rush_power = 20;

    if (direction_enum_value === RushDirections.UP) {
        this.velocity.setY(-rush_power);
    }

    if (direction_enum_value === RushDirections.DOWN) {
      this.velocity.setY(rush_power);
    }

    if (direction_enum_value === RushDirections.LEFT) {
      this.velocity.setX(-rush_power);
    }

    if (direction_enum_value === RushDirections.RIGHT) {
      this.velocity.setX(rush_power);
    }
    
    if (!this.is_on_ground()) this.can_use_rush = false;
  }

  spawn() {
    while (true) {

      this.position.copyOther(new Vector(Math.floor(Math.random() * (TPZONE_RIGHT - TPZONE_LEFT)) + TPZONE_LEFT, Math.floor(Math.random() * 2000 - 2500)));
      this.collision_rect.top_left = this.position;

      if (this.get_movement_collisions(new Vector(0, 0)).length > 0) {
        continue;
      }

      let is_ok = true;
      while (this.get_movement_collisions(new Vector(0, 1)).length === 0) {
        this.position.setY(this.position.getY() + 1);
        if (this.position.getY() > TPZONE_BOTTOM) {
          is_ok = false;
          break;
        }
      }

      if (is_ok) {
        break;
      }
    }
    console.log("Spawned player!");
  }

  set_health(new_health : number) {
    this.health = Math.min(new_health, MAX_HEALTH);
  }

  update(update_evt : IUpdate) {
    this.apply_physics(/*1*/ Math.floor(update_evt.ticks * 100) / 100);
    this.collision_rect.top_left = this.position;
    this.sync_controller.record_position(this.position);

    this.gun_pullup_cooldown = Math.max(0, this.gun_pullup_cooldown - update_evt.ticks);

    if (!this.can_use_rush && this.is_on_ground()) {
      this.can_use_rush = true;
    }

    if (this.world.simulation_permissions.can_perform_regen) {
      this.regen_timer += update_evt.ticks;
      if (this.regen_timer > 100) {
          this.regen_timer = 0;
          this.set_health(this.health + 1);
      }
    }

    this.weapons.forEach(weapon => weapon.update(update_evt));
    this.sync_controller.attempt_sync(this.position);
  }

  sync_pos(expected_pos : Vector, callback : () => void) {
    // @TODO reimplement
    this.position.copyOther(expected_pos);
    callback();

    /*this.sync_controller.sync_serverclient_positions(
      expected_pos,
      MAX_ROLLBACK_POINT_DIST,
      MAX_POSSYNC_CHECK_COUNT, MAX_POSSYNC_POINT_DIST,
      (accepted : boolean) => {
        if (accepted) {
          this.position = expected_pos;
        }

        callback();
      }
    );*/
  }

  damage_player(amount : number, death_info_handler : () => IDeathHandlerInfo, attacker? : TPlayer) : boolean {
    this.set_health(this.health - amount);
    return this.health <= 0;
  }

  apply_physics(ticks : number) {
    const tick_multiplier = this.using_scope ? 0 : 0.8 + (this.get_active_weapon().get_upgrades().additional_launching_power * 0.06) - (0.1 * this.get_active_weapon().get_upgrades().slow_motion);
    ticks = ticks * tick_multiplier;

    const FRICTION = this.get_friction_coef();
    const GRAVITY = this.get_gravity_force();

    const calculate_position_friction = (start_pos : number, start_vel : number, fric : number, time : number) => (start_vel / fric) * (1 - Math.pow(Math.E, -fric * time)) + start_pos
    const calculate_velocity_friction = (start_vel : number, fric : number, time : number) => start_vel * Math.pow(fric, time);

    const calculate_position_gravity = (start_pos : number, start_vel : number, gravity : number, time : number) => (time * time * gravity) / 2 + start_vel * time + start_pos;
    const calculate_velocity_gravity = (start_vel : number, gravity : number, time : number) => gravity * time + start_vel

    const delta_position = new Vector(
      calculate_position_friction(this.position.getX(), this.velocity.getX(), FRICTION, ticks),
      calculate_position_gravity(this.position.getY(), this.velocity.getY(), GRAVITY, ticks)
    ).sub(this.position);
    
    const new_velocity = new Vector(
      calculate_velocity_friction(this.velocity.getX(), FRICTION, ticks),
      calculate_velocity_gravity(this.velocity.getY(), GRAVITY, ticks)
    );
    
    this.velocity.copyOther(new_velocity);
    
    for (let x = 0; x < Math.floor(Math.abs(delta_position.getX())); x += 0.5) {
      const vec = new Vector(Math.sign(delta_position.getX()), 0);
      if (
        this.get_movement_collisions(vec).length === 0 &&
        TPZONE_LEFT < this.collision_rect.point_bottom_left().getX() + vec.getX() && this.collision_rect.point_bottom_right().getX() + vec.getX() < TPZONE_RIGHT
      ) this.position.mutadd(vec);
    }

    for (let y = 0; y < Math.abs(delta_position.getY()); y++) {
      const vec = new Vector(0, Math.sign(delta_position.getY()));
      if (
        this.get_movement_collisions(vec).length === 0 &&
        TPZONE_BOTTOM > this.collision_rect.point_bottom_left().getY() + vec.getY() &&
        TPZONE_TOP < this.collision_rect.point_top_left().getY() + vec.getY()
      ) {
        this.position.mutadd(vec);
      } else {
        this.velocity.setY(0);
        break;
      }
    }

    this.position.setPair(
      clamp_num(
        TPZONE_LEFT,
        this.position.getX(),
        TPZONE_RIGHT - this.collision_rect.get_width()
      ),
      clamp_num(
        TPZONE_TOP,
        this.position.getY(),
        TPZONE_BOTTOM - this.collision_rect.get_height()
      )
    );
  }

  static is_valid_username(username : string) : string {
    // @TODO validate
    if (username.length === 0) {
      return "Please fill in this field.";
    }
  
    if (username.length > 25) {
      return "That name is too long";
    }
  
    return null;
  }

  send_message(message : ITextComponent[]) {
    this.chat_log.push(message);

    if (this.chat_log.length >= 20) {
        this.chat_log.shift();
    }   
  }
  
  abstract generate_weapon(index : number) : TWeapon;
}

export interface IDeathHandlerInfo {
  public_message : ITextComponent[],
  personal_message : ITextComponent[]
}