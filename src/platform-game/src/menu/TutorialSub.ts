import { MenuBGSub } from "./MenuBGSub";
import { ITextComponent } from "../../../helpers-common/helpers/ITextComponent";
import { Rect } from "../../../helpers-common/helpers/Rect";
import Vector from "../../../helpers-common/helpers/Vector";
import { draw_text, AlignmentModes } from "../../../helpers-client/draw_text";
import { get_theme_rainbow, get_theme_dark, get_theme_red } from "../../../helpers-client/ColorTheme";
import { discord_invite_url, WEAPONS_HELD } from "../../../config/Config";
import { rainbow_color } from "../../../helpers-client/color";

interface UnloadedTutorialSlide {
    text : ITextComponent[][],
    image_src : string
}

interface LoadedTutorialSlide {
    text : ITextComponent[][],
    image : HTMLImageElement
}

const slide_configuration : UnloadedTutorialSlide[] = [
    {
        image_src: "/static/img/tutorial/welcome.png",
        text: [
            [
                {
                    color: get_theme_dark(),
                    bg: get_theme_rainbow(),
                    text: "  Welcome to Heat Gun  ",
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "Heat Gun is a "
                },
                {
                    color: "#fff",
                    text: "multiplayer sidescroller shooter."
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "The objective is to get as much energy as you can before dying"
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "and make it to the top of the leaderboard."
                }
            ]
        ]
    },
    {
        image_src: "/static/img/tutorial/movement.png",
        text: [
            [
                {
                    color: get_theme_dark(),
                    bg: get_theme_rainbow(),
                    text: "  Movement  ",
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "In Heat Gun, the main mode of"
                },
                {
                    color: "#fff",
                    text: " transportation is your gun."
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "Every time you shoot, "
                },
                {
                    color: "#fff",
                    text: "you get propelled backwards."
                }
            ],
            [],
            [
                {
                    color: "#ccc",
                    text: "You can also use WASD to dash around"
                }
            ],
            [
                {
                    color: "#ccc",
                    text: "but it's limited without using your gun as well."
                }
            ]
        ]
    },
    {
        image_src: "/static/img/tutorial/ammo.png",
        text: [
            [
                {
                    color: get_theme_dark(),
                    bg: get_theme_rainbow(),
                    text: "  Ammo  ",
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "Like many other games, "
                },
                {
                    color: "#fff",
                    text: "your guns have ammo."
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "However, unlike other games, "
                }
            ],
            [
                {
                    color: "#fff",
                    text: "you regain full ammo after landing "
                },
                {
                    color: get_theme_red(),
                    text: "on the ground again. "
                }
            ]
        ]
    },
    {
        image_src: "/static/img/tutorial/energy.png",
        text: [
            [
                {
                    color: get_theme_dark(),
                    bg: get_theme_rainbow(),
                    text: "  Energy  ",
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "In Heat Gun, energy is the most important resource."
                },
            ],
            [],
            [
                {
                    bg: get_theme_red(),
                    color: "#fff",
                    text: " Getting it "
                }
            ],
            [
                {
                    color: "#fff",
                    text: " Every time you damage a player, you get energy."
                }
            ],
            [],
            [
                {
                    bg: get_theme_red(),
                    color: "#fff",
                    text: " Purposes "
                }
            ],
            [
                {
                    color: "#fff",
                    text: "1) It's your score. "
                },
                {
                    color: get_theme_red(),
                    text: "The more total energy you have,"
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "the higher you will be ranked in the scoreboard."
                }
            ],
            [],
            [
                {
                    color: "#fff",
                    text: "2) "
                },
                {
                    color: get_theme_red(),
                    text: "See next page"
                }
            ]
        ]
    },
    {
        image_src: "/static/img/tutorial/upgrades.png",
        text: [
            [
                {
                    color: get_theme_dark(),
                    bg: get_theme_rainbow(),
                    text: "  Upgrades  ",
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "Default guns are terrible. Upgrades can make them better."
                }
            ],
            [],
            [
                {
                    color: "#fff",
                    text: "By pressing "
                },
                {
                    bg: "#fff",
                    color: "#222",
                    text: " F "
                },
                {
                    color: "#fff",
                    text: " you can open the upgrade menu."
                },
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "You can level up different traits of your weapon"
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "and salvage purchased traits to regain "
                },
                {
                    color: "#fff",
                    text: "all the energy spent."
                }
            ],
            [],
            [
                {
                    color: get_theme_rainbow(),
                    text: "Please note: The menu uses the arrow keys, not the mouse!"
                }
            ],
            [
                {
                    color: get_theme_rainbow(),
                    text: "Look at the bottom of the upgrades menu to see the controls!"
                }
            ]
        ]
    },
    {
        image_src: "/static/img/tutorial/etc.png",
        text: [
            [
                {
                    color: get_theme_dark(),
                    bg: get_theme_rainbow(),
                    text: "  Other notes...  ",
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "You have " + WEAPONS_HELD + " different weapons you can level up!"
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "You can select them by pressing "
                },
                {
                    bg: "#fff",
                    color: "#222",
                    text: " 1 "
                },
                {
                    color: get_theme_red(),
                    text: ", "
                },
                {
                    bg: "#fff",
                    color: "#222",
                    text: " 2 "
                },
                {
                    color: get_theme_red(),
                    text: " or "
                },
                {
                    bg: "#fff",
                    color: "#222",
                    text: " 3 "
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "You can hide behind the "
                },
                {
                    bg: rainbow_color({ time_div: 20, saturation: 10, light: 30 }),
                    color: get_theme_rainbow(),
                    text: " colorful "
                },
                {
                    color: get_theme_red(),
                    text: " objects."
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "Then, enemies can only see you if they're hiding behind the same cover as you."
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "You can scope using "
                },
                {
                    bg: "#fff",
                    color: "#222",
                    text: " Space "
                },
                {
                    color: get_theme_red(),
                    text: " to help you "
                },
                {
                    color: "#fff",
                    text: "line up a shot."
                },
            ]
        ]
    },
    {
        image_src: "/static/img/tutorial/welcome.png",
        text: [
            [
                {
                    color: get_theme_dark(),
                    bg: get_theme_rainbow(),
                    text: "  Thank You  ",
                }
            ],
            [],
            [
                {
                    color: get_theme_red(),
                    text: "Thank you for reading through the tutorial.",
                }
            ],
            [],
            [
                {
                    color: "#fff",
                    text: "There is a high skill ceiling to this game.",
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "Don't feel discouraged when you get destroyed by a better player;"
                }
            ],
            [
                {
                    color: get_theme_red(),
                    text: "with a bit of playing, you soon will be that better player!",
                }
            ],
            [],
            [
                {
                    color: "#fff",
                    text: "Good luck,"
                }
            ],
            [
                {
                    color: get_theme_rainbow(),
                    text: "- radbuglet"
                }
            ]
        ]
    }
];

const loaded_slides : LoadedTutorialSlide[] = slide_configuration.map(slide => {
    const image = new Image();
    image.src = slide.image_src;
    image.onload = () => {
        const sf = 1000 / image.width;
        image.width *= sf;
        image.height *= sf;
    }
    return { text: slide.text, image };
});

export class TutorialSub extends MenuBGSub {
    private slide_index : number = 0;

    constructor(main, loader, private end_tutorial_handler : () => void) {
        super(main, loader);
    }

    app_keydown() {

    }

    app_keyup() {
        
    }

    app_mousedown() {

    }

    app_mouseup() {

    }

    app_update(dt, ticks_passed) {
        super.app_update(dt, ticks_passed);
    }

    app_render(ctx : CanvasRenderingContext2D, width : number, height : number, ticks_passed : number) {
        super.app_render(ctx, width, height, ticks_passed);

        this.draw(() => {
            ctx.fillStyle = "#000";
            ctx.globalAlpha = 0.8;
            ctx.fillRect(0, 0, width, height);
        });

        this.draw(() => {
            draw_text(this, width + 1, 10, "20px monospace", 20, [
                [
                    {
                        bg: get_theme_rainbow(),
                        hover_bg: "#fff",
                        color: get_theme_dark(),
                        text: "  Skip tutorial  ",
                        click_func_action: () => {
                            this.end_tutorial_handler();
                        }
                    }
                ]
            ], AlignmentModes.right);
        })

        this.draw(() => {
            const active_slide = loaded_slides[this.slide_index];
            const draw_rect = Rect.centered_around(new Vector(width / 2, height / 2), new Vector(active_slide.image.width, active_slide.image.height + 20 + (active_slide.text.length * 30)));
            const image_rect = draw_rect.clone_and_perform(rect => {
                rect.size.setY(active_slide.image.height);
            });

            const left_rect = Rect.from_positions(image_rect.point_top_left().sub(new Vector(100, 0)), image_rect.point_bottom_left());
            const right_rect = Rect.from_positions(image_rect.point_top_right(), image_rect.point_bottom_right().add(new Vector(100, 0)));

            this.draw(() => {
                const left_middle = left_rect.point_middle();
                const right_middle = right_rect.point_middle();

                const left_hovered = Rect.centered_around(this.get_mouse_position(), new Vector(1, 1)).testcollision(left_rect);
                const right_hovered = Rect.centered_around(this.get_mouse_position(), new Vector(1, 1)).testcollision(right_rect);

                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;

                if (this.slide_index > 0) {
                    ctx.beginPath();
                    ctx.moveTo(left_middle.getX(), left_middle.getY() - 20);
                    ctx.lineTo(left_middle.getX() - 20, left_middle.getY());
                    ctx.lineTo(left_middle.getX(), left_middle.getY() + 20);
    
                    ctx.globalAlpha = left_hovered ? 1 : 0.4;
                    ctx.stroke();

                    if (left_hovered) {
                        this.set_pointer_mode("pointer");

                        if (this.is_mouse_down_frame()) {
                            this.slide_index--;
                        }
                    }
                }

                ctx.beginPath();
                ctx.moveTo(right_middle.getX(), right_middle.getY() - 20);
                ctx.lineTo(right_middle.getX() + 20, right_middle.getY());
                ctx.lineTo(right_middle.getX(), right_middle.getY() + 20);

                ctx.globalAlpha = right_hovered ? 1 : 0.7;
                ctx.stroke();

                if (right_hovered) {
                    this.set_pointer_mode("pointer");

                    if (this.is_mouse_down_frame()) {
                        this.slide_index++;

                        if (this.slide_index >= loaded_slides.length) this.end_tutorial_handler();
                    }
                }
            });

            ctx.drawImage(active_slide.image, draw_rect.get_x(), draw_rect.get_y(), active_slide.image.width, active_slide.image.height);
    
            draw_text(this, width / 2, draw_rect.get_y() + active_slide.image.height + 20, "30px monospace", 30, active_slide.text, AlignmentModes.centered);
        });
    }
}