var game = {
    map: {
        // mary.mid
        ground: [{'note': {'pitch': 64, 'velocity': 72}, 'rect': [0.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 85}, 'rect': [512.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 78}, 'rect': [640.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 74}, 'rect': [768.0, 340, 211.0, 20]}, {'note': {'pitch': 64, 'velocity': 82}, 'rect': [1536.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 73}, 'rect': [2048.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 84}, 'rect': [2560.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 76}, 'rect': [2688.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 74}, 'rect': [2816.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 77}, 'rect': [2944.0, 340, 95.5, 20]}, {'note': {'pitch': 64, 'velocity': 81}, 'rect': [3328.0, 340, 95.5, 20]}, {'note': {'pitch': 67, 'velocity': 84}, 'rect': [1664.0, 280, 95.5, 20]}, {'note': {'pitch': 67, 'velocity': 75}, 'rect': [1792.0, 280, 211.0, 20]}, {'note': {'pitch': 52, 'velocity': 72}, 'rect': [3584.0, 580, 467.0, 20]}, {'note': {'pitch': 55, 'velocity': 70}, 'rect': [0.0, 520, 467.0, 20]}, {'note': {'pitch': 55, 'velocity': 79}, 'rect': [512.0, 520, 467.0, 20]}, {'note': {'pitch': 55, 'velocity': 77}, 'rect': [1024.0, 520, 467.0, 20]}, {'note': {'pitch': 55, 'velocity': 79}, 'rect': [1536.0, 520, 467.0, 20]}, {'note': {'pitch': 55, 'velocity': 78}, 'rect': [2048.0, 520, 467.0, 20]}, {'note': {'pitch': 55, 'velocity': 79}, 'rect': [2560.0, 520, 467.0, 20]}, {'note': {'pitch': 55, 'velocity': 78}, 'rect': [3072.0, 520, 467.0, 20]}, {'note': {'pitch': 60, 'velocity': 71}, 'rect': [256.0, 420, 95.5, 20]}, {'note': {'pitch': 60, 'velocity': 71}, 'rect': [2304.0, 420, 95.5, 20]}, {'note': {'pitch': 60, 'velocity': 73}, 'rect': [3584.0, 420, 467.0, 20]}, {'note': {'pitch': 62, 'velocity': 72}, 'rect': [128.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 79}, 'rect': [384.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 75}, 'rect': [1024.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 77}, 'rect': [1152.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 75}, 'rect': [1280.0, 380, 211.0, 20]}, {'note': {'pitch': 62, 'velocity': 69}, 'rect': [2176.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 80}, 'rect': [2432.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 75}, 'rect': [3072.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 74}, 'rect': [3200.0, 380, 95.5, 20]}, {'note': {'pitch': 62, 'velocity': 70}, 'rect': [3456.0, 380, 95.5, 20]}]
    }
};
$(function(){
    game.dev_mode = false;

    game.dom = {};

    game.dom.ground     = $('#ground').css('zIndex', 5);
    game.dom.dude       = $('#dude')  .css('zIndex', 6);
    game.dom.dude_parts = game.dom.dude.find('.head, .body');

    game.default_gravity = 0.001;
    game.gravity = game.default_gravity;

    game.max_vy = 1.5;
    game.min_vy = -1;

    game.last_jump = 0;

    game.dude = {};
    game.dude.vx = 0;
    game.dude.vy = 0;

    game.dude.css = {};
    game.dude.css.height = 90;
    game.dude.css.width = 30;
    game.dude.css.left = 100;
    game.dude.css.top = 100;

    game.dude_parts = {};
    game.dude_parts.css = {};
    game.dude_parts.css.background = '1px solid rgb(21, 195, 88, 0.6)';
    game.dude_parts.css.boxShadow = '0px -5px 20px rgba(21, 195, 88, 0.8), inset 0px -5px 20px rgba(21, 195, 88, 0.8)';

    game.ground = {};
    game.ground.left = 0;

    game.depressed_keys = {};

    game.fps = 1000 / 30;

    game.tick = 0;

    game.init = function() {
        game.setup_key_handlers();
        game.draw_ground();

        //initialize object locations
        game.dom.ground.css('left', game.ground.left);
        game.dom.dude.css(game.dude.css);
        game.dom.dude_parts.css(game.dude_parts.css);

        setInterval(function(){
            game.tick += 1;
            game.render();
        }, game.fps);
    };

    game.render = function() {
        game.ground.left -= 2;
        game.dom.ground.css('left', game.ground.left);
        game.check_depressed_keys();
        game.update_dude_position();
        game.dom.dude.css(game.dude.css);
        game.dom.dude_parts.css(game.dude_parts.css);
        game.helpers.dude_collision();

        //turn on house music :P
        //game.dom.ground.css('opacity', (100 - (game.tick % 25) * 5) * 0.01);
    };

    game.setup_key_handlers = function() {
        $('body')
            .keydown(function(e){
                game.depressed_keys[e.keyCode] = true;
            })
            .keyup(function(e){
                delete game.depressed_keys[e.keyCode];
            })
        ;
    };

    game.update_dude_position = function() {
        var dx, dy, t, vx, vy;
        dx = dy = vx = vy = 0;
        t = game.fps;

        vy = game.dude.vy + (game.gravity * t);
        vy = Math.max(Math.min(game.max_vy, vy), game.min_vy);
        dy = 0.5 * (game.dude.vy + vy) * t;
        game.dude.vy = vy;

        vx = game.dude.vx * (0.8 + (0.2 * Math.min(game.dude.vx, 0.8)));
        dx = 0.5 * (game.dude.vx + vx) * t;
        game.dude.vx = vx;

        //dy = (game.dude.vx * t);
        game.dude.css.top += dy;
        game.dude.css.left += dx - 2;

        if (game.dude.css.top > $(window).height()) {
            game.dude.css.top = -10 - game.dude.css.height;
        }
    };

    game.jump_dude = function() {
        // don't let jump happen too often
        if (game.last_jump < game.tick - 20) {
            if (game.helpers.dude_on_ground()) {
                game.last_jump = game.tick;
                game.dude.vy -= 0.5;
            }
        }
    };

    game.check_depressed_keys = function() {
        var k;
        for (k in game.depressed_keys) {
            switch (parseInt(k, 10)) {
                case 37: //left
                    game.dude.vx -= 0.05;
                break;
                case 39: //right
                    game.dude.vx += 0.05;
                break;
                case 32: //spacebar
                case 38: //up
                    game.jump_dude();
                break;
                case 40: //down
                    //game.dude.css.top += 10;
                break;
                default:
                    //console.log(k);
                break;
            }
        }
    };

    game.draw_ground = function() {
        var i, g, r, c;
        for (i in game.map.ground) {
            g = game.map.ground[i];
            c = 'rgba(' + (30 * (g.note.pitch % 12)) + ', 100, 200, 1)';
            g.dom = $('<div/>')
                .addClass('block')
                .css({
                    left: g.rect[0],
                    top: g.rect[1],
                    width: g.rect[2],
                    height: g.rect[3],
                    border: '2px solid ' + c,
                    boxShadow: '0px 0px 20px ' + c + ', inset 0px 0px 20px ' + c
                })
                .data('ground', g)
            ;
            game.dom.ground.append(g.dom);
        }
    };

    game.animations = {};

    game.animations.block_dude_collision = function(block, offset) {
        var landing = $('<div />'),
            relative = block.find('.relative')
        ;
        if (!relative.length) {
            relative = $('<div/>').addClass('relative');
            block.append(relative);
        }
        landing
            .addClass('landing')
            .addClass('flyinout')
            .css('marginLeft', - 23 - offset)
        ;
        relative.append(landing);
        setTimeout(function(){
            landing.remove();
        }, 3000);
    };

    game.helpers = {};

    game.helpers.dude_on_ground = function() {
        return game.gravity === 0; //TODO - fix this
    };

    game.helpers.dude_collision = function() {
        var i, g,
            collide = false,
            x1, y1, w1, h1, x2, y2, w2, h2
        ;
        x2 = game.dude.css.left;
        y2 = game.dude.css.top;
        w2 = game.dude.css.width;
        h2 = game.dude.css.height;

        for (i in game.map.ground) {
            g = game.map.ground[i];

            x1 = g.rect[0] + game.ground.left;
            y1 = g.rect[1];
            w1 = g.rect[2];
            h1 = g.rect[3];

            if (game.helpers.collision(x1, y1, w1, h1, x2, y2, w2, h2)) {
                collide = true;
                break;
            }
        }
        if (collide === true) {
            if (x2 > x1 && x2 + w2 < x1 + g.rect[2]) {
                if (y2 < g.rect[1] && y2 + h2 < g.rect[1] + g.rect[3] && game.dude.vy > 0) {
                    game.dude.vy = 0;
                    game.gravity = 0;
                    game.dude.css.top = y1 - (h2 - 1);
                    game.animations.block_dude_collision(g.dom, (x1 + 0.5 * w1) - (x2 + 0.5 * w2));
                } else {
                    game.dude.vy = game.dude.vy * 0.4;
                    if (game.dude.vy < 0) {
                        game.dude.vy *= -1;
                    } else {
                        game.dude.css.top = y1 - (h2 - 1);
                        game.dude.vy = 0;
                    }
                }
            } else {
                if (y2 + h2 > x1 + h1) {
                    if (x2 > x1) {
                        x2 = x1 + g.rect[2] + 1;
                    } else {
                        x2 = x1 - w2 - 1;
                    }
                    game.dude.vx = 0;
                }
            }
            if (game.dev_mode) {
                game.dom.dude_parts.css('background', 'rgba(50, 0, 0, 0.6)');
                game.dom.dude_parts.css('boxShadow', '0px -5px 20px red, inset 0px -5px 20px red');
            }
        } else {
            game.gravity = game.default_gravity;
            if (game.dev_mode) {
                game.dom.dude_parts.css('background', game.dude_parts.css.background);
                game.dom.dude_parts.css('boxShadow', game.dude_parts.css.boxShadow);
            }
        }
    };

    game.helpers.collision = function(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x2 < (x1 + w1) && (x2 + w2) > x1 && y2 < (y1 + h1) && (y2 + h2) > y1;
    };

    game.init();
});