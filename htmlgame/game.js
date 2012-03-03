var game = {};
var midi = {};

$(function(){
    game.first_piece = {'note': {/* 'color': 'white', */'pitch': 100, 'velocity': 72}, 'rect': [-1500, 340, 1450, 20]};
    game.map = {};

    game.map.ground = midi.mary;
    //game.map.ground = midi.brickone;

    game.map.ground.push(game.first_piece);

    game.dev_mode = true;

    game.dom = {};

    game.dom.camera     = $('#camera');
    game.dom.ground     = $('#ground').css('zIndex', 5);
    game.dom.dude       = $('#dude')  .css('zIndex', 6);
    game.dom.dude_parts = game.dom.dude.find('.head, .body');

    game.themes = ['default', 'pink', 'dark'];
    game.theme = '';

    game.default_gravity = 0.001;
    game.gravity = game.default_gravity;

    game.max_vy = 1.5;
    game.min_vy = -1;

    game.end = 0;

    game.last_jump = 0;

    game.dude = {};
    game.dude.vx = 0;
    game.dude.vy = 0;

    game.dude.css = {};
    game.dude.css.height = 90;
    game.dude.css.width = 30;

    game.dude_parts = {};
    game.dude_parts.css = {};
    game.dude_parts.css.background = '1px solid rgb(21, 195, 88, 0.6)';
    game.dude_parts.css.boxShadow = '0px -5px 20px rgba(21, 195, 88, 0.8), inset 0px -5px 20px rgba(21, 195, 88, 0.8)';

    game.ground = {};

    game.depressed_keys = {};

    game.fps = 1000 / 30;
    game.tick = 0;
    game.pause = false;

    game.init = function() {
        game.setup_key_handlers();
        game.draw_ground();

        //initialize object locations
        game.init_game_object_locations();

        game.render();
        game.dom.camera.show();

        setInterval(function(){
            if (!game.pause) {
                game.tick += 1;
                game.render();
            }
            game.check_depressed_keys();
        }, game.fps);
    };

    game.init_game_object_locations = function() {
        game.tempo = 0;
        game.dude.css.top = -5000;
        game.dude.css.left = $(window).width() / 2;
        game.ground.left = 1300 + ($(window).width() / 2);
    };

    game.render = function() {
        game.dom.ground.css('left', game.ground.left);
        game.update_camera_position();
        game.update_dude_position();
        //game.update_camera_position(); //TODO - investigate timing of camera positioning vs player
        game.helpers.dude_collision();
        game.dom.dude.css(game.dude.css);
        game.dom.dude_parts.css(game.dude_parts.css);

        //turn on house music :P
        //game.dom.ground.css('opacity', (100 - (game.tick % 25) * 5) * 0.01);
    };

    game.setup_key_handlers = function() {
        $('body')
            .keydown(function(e){
                game.depressed_keys[e.keyCode] = true;
                return false;
            })
            .keyup(function(e){
                delete game.depressed_keys[e.keyCode];
                return false;
            })
        ;
    };

    game.update_camera_position = function() {
        // TODO - make these smoother

        /*
        // trippy...
        game.dom.camera.css({
            left: game.dude.css.left - ($(window).width() / 2),
            top: game.dude.css.top - ($(window).height() / 2)
        });
        */

        game.dom.camera.css({
            //left: ($(window).width() / 2) - game.dude.css.left,
            top: ($(window).height() / 2) - game.dude.css.top
        });

        game.ground.left -= game.tempo;
        if (game.ground.left * -1 > game.end + 1000) {
            game.init_game_object_locations();
        }
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
        game.dude.css.left += dx - game.tempo;

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
            k = parseInt(k, 10);

            switch (k) {
                case 32: //spacebar
                    //if (game.dev_mode) {}
                    game.toggle_pause();
                    delete game.depressed_keys[32];
                break;
                case 67: //c is for color :)
                    game.cycle_theme();
                    delete game.depressed_keys[67];
                break;
            }

            if (!game.pause) {
                switch (k) {
                    case 37: //left
                        game.dude.vx -= 0.05;
                    break;
                    case 39: //right
                        game.tempo = 6;
                        game.dude.vx += 0.05;
                    break;
                    case 38: //up
                    case 91: //command
                    case 16: //shift
                    case 17: //option
                        game.jump_dude();
                    break;
                    case 77: //m for mega dude!
                        if (game.dude.css.height !== 90) {
                            game.dude.css.height = 90;
                            game.dude.css.width = 30;
                        } else {
                            game.dude.css.height = 120;
                            game.dude.css.width = 40;
                        }
                        delete game.depressed_keys[77];
                    break;
                    //case 40: //down for charge?
                    //shooting? etc...
                    default:
                        console.log(k);
                    break;
                }
            }
        }
    };

    game.cycle_theme = function() {
        game.theme = game.themes[(game.themes.indexOf(game.theme) + 1) % game.themes.length];
        $('html').get(0).className = game.theme;
    };

    game.toggle_pause = function() {
        game.pause = !game.pause;
    };

    game.draw_ground = function() {
        var i, g, r, c;
        for (i in game.map.ground) {
            g = game.map.ground[i];
            if (g.rect[0] < 20000) { //TODO - dynamically load the part of the ground we need
                if (g.rect[0] > game.end) {
                    game.end = g.rect[0];
                }
                c = g.note.color ? g.note.color : 'rgba(' + (30 * (g.note.pitch % 12)) + ', 100, 200, 1)';
                g.rect[2] = Math.max(g.rect[2], 100);
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
            .css('marginLeft', - 26 - offset)
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
                    //game.dude.vy *= -0.1;
                    game.dude.vy = 0;
                    game.gravity = 0;
                    game.dude.css.top = y1 - (h2 - 1);
                    game.animations.block_dude_collision(g.dom, (x1 + 0.5 * w1) - (x2 + 0.5 * w2));
                } else {
                    game.dude.vy = game.dude.vy * 0.4;
                    if (game.dude.vy < 0) {
                        //game.dude.vy *= -0.5;
                        game.dude.vy = 0;
                    } else {
                        game.dude.css.top = y1 - (h2 - 1);
                        //game.dude.vy *= -0.5;
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
                game.dude_parts.css.background = 'rgba(50, 0, 0, 0.6)';
                game.dude_parts.css.boxShadow = '0px -5px 20px red, inset 0px -5px 20px red';
            }
        } else {
            game.gravity = game.default_gravity;
            if (game.dev_mode) {
                game.dude_parts.css.background = '1px solid rgb(21, 195, 88, 0.6)';
                game.dude_parts.css.boxShadow = '0px -5px 20px rgba(21, 195, 88, 0.8), inset 0px -5px 20px rgba(21, 195, 88, 0.8)';
            }
        }
    };

    game.helpers.collision = function(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x2 < (x1 + w1) && (x2 + w2) > x1 && y2 < (y1 + h1) && (y2 + h2) > y1;
    };

    game.init();
});