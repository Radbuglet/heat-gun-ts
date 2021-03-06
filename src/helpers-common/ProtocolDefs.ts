export enum PacketNames {
    replicate_new_beam = 0,
    send_message,
    replicate_player_mov_changed,
    replicate_player_health_changed,
    state_change__to_game,
    state_change__to_death,
    replicate_player_list,
    shoot_gun,
    play,
    set_scope,
    modify_weapon_trait,
    replicate_weapon_info_change,
    replicate_energy_change,
    perform_dash,
    replicate_slot_change,
    replicate_player_damaged,
    replicate_crystal_list,
    validate_captcha,
    perform_activate_powerup,
    replicate_powerup_crystals,
    replicate_player_crystal_state
}

export function decode_packet_name(num : PacketNames) {
    return [
        'replicate_new_beam',
        'send_message',
        'replicate_player_mov_changed',
        'replicate_player_health_changed',
        'state_change__to_game',
        'state_change__to_death',
        'replicate_player_list',
        'shoot_gun',
        'play',
        'set_scope',
        'modify_weapon_trait',
        'replicate_weapon_info_change',
        'replicate_energy_change',
        'perform_dash',
        'replicate_slot_change',
        'replicate_player_damaged',
        'replicate_crystal_list',
        'validate_captcha',
        'perform_activate_powerup',
        'replicate_powerup_crystals',
        'replicate_player_crystal_state'
    ][num];
}