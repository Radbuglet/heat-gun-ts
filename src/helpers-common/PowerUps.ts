export enum PowerupTypeNames {
    Invisibility = "invisibility",
    InfiniteDashes = "infinite_dashes",
    InstantHeal = "instant_heal",
    BulletFaze = "faze_bullet",
    UnlimitedAmmo = "unlimited_ammo",
}

export const powerup_types = {
    invisibility: {
      name: "Invisibility",
      bg_color: "lightblue",
      duration: 20,
      rand_repeat: 2
    },
    infinite_dashes: {
      name: "Infinite dashes",
      bg_color: "yellow",
      duration: 15,
      rand_repeat: 3
    },
    instant_heal: {
      name: "Instant heal",
      bg_color: "red",
      duration: 0,
      rand_repeat: 2
    },
    faze_bullet: {
      name: "Bullet faze",
      description: "(phases through anything!)",
      bg_color: "#aaa",
      duration: 30,
      rand_repeat: 1
    },
    unlimited_ammo: {
      name: "Unlimited ammo",
      bg_color: "brown",
      duration: 15,
      rand_repeat: 1
    }
  }