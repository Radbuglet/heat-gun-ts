export interface ITextComponent {
    color : string
    text : string
    bg? : string
    click_underline? : string
    click_url_action? : string
    click_func_action? : () => void
    space_size_after? : number

    hover_color? : string,
    hover_bg? : string
}