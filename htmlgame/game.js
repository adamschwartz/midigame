var game = {
        songs: {}
    }
;

// Patching layerX and layerY bug to circumvent breakage due to
// webkit (and forthcoming mozilla) deprecation
// code from: http://stackoverflow.com/questions/7825448/webkit-issues-with-event-layerx-and-event-layery
// jquery ticket: http://bugs.jquery.com/ticket/10531
(function($){
    // remove layerX and layerY
    var all = $.event.props,
        len = all.length,
        res = [];
    while (len--) {
      var el = all[len];
      if (el != 'layerX' && el != 'layerY') res.push(el);
    }
    $.event.props = res;
}(jQuery));

$(function() {
    var g = game;

    g.song = 'mary'; //had a little lamb

    //g.dev_mode = true; // TODO ---

    g.dom = {};

    g.dom.camera     = $('#camera');
    g.dom.background = $('#background');
    g.dom.song_background = $('#background .song-background');
    g.dom.ground     = $('#ground').css('zIndex', 5);
    g.dom.dude       = $('#dude-sprite');//.css('zIndex', 30);

    g.dom.dude.append('<img src="dudesprite32.png" />');

    g.dom.dude.find('.body').hide();

    g.themes = ['black', 'pink', 'grey', 'white'];
    g.theme = g.themes[0];

    g.gravity = 0.08;

    g.max_vy = 1.5;
    g.min_vy = -1;

    g.end = 0;

    g.last_jump = 0;

    g.dude = {};
    g.dude.sprite_states = {
        JUMPLEFT: 0,
        RUNLEFT1: 1,
        RUNLEFT2: 2,
        RUNLEFT3: 3,
        STANDLEFT: 5,
        STANDRIGHT: 6,
        RUNRIGHT1: 7,
        RUNRIGHT2: 8,
        RUNRIGHT3: 9,
        JUMPRIGHT: 11
    };
    g.dude.vx = 0;
    g.dude.vy = 0;

    g.dude.css = {};
    g.dude.css.height = 90;
    g.dude.css.width = 30;

    g.dude_parts = {};
    g.dude_parts.css = {};
    g.dude_parts.css.background = '1px solid rgb(21, 195, 88, 0.6)';
    g.dude_parts.css.boxShadow = '0px -5px 20px rgba(21, 195, 88, 0.8), inset 0px -5px 20px rgba(21, 195, 88, 0.8)';

    g.ground = {};

    g.depressed_keys = {};

    g.fps = 30;
    g.tick = 0;
    g.tempo = 0;
    g.pause = false;

    g.block_scale = 32;
    g.block_border_width = 2;
    g.starting_block_x = 3;
    g.starting_block_y = -30;

    g.dude.pos = [g.starting_block_x, g.starting_block_y];
    g.dude.vel = [0, 0];
    //g.dude.vel_min = [-0.4, -0.85];
    //g.dude.vel_max = [0.4, 0.8];
    g.dude.vel_min = [-0.7, -1.25];
    g.dude.vel_max = [0.7, 1.2];
    g.dude.dir = 0;
    g.dude.face_dir = 1;
    g.dude.on_ground = 0;

    g.current_scroll = 0;

    g.init = function() {
        g.dom.camera.css('left', ($(window).width() / 2) - ((g.starting_block_x + 0.5) * g.block_scale));

        g.setup_key_handlers();
        g.setup_window_resize();

        g.draw_ground(true);/* Math.random() > 0.5 */
        g.dude_set_sprite(g.dude.sprite_states.JUMPRIGHT);

        setInterval(function(){
            if (!g.pause) {
                g.tick += 1;
                g.render();
            }
        }, 1000 / g.fps);
    };

    g.dude_set_sprite = function(id) {
        g.dom.dude.scrollLeft(id * g.block_scale);
    };

    g.render = function() {
        g.tick += 1;
        g.do_dude_stuff();
    };

    g.do_dude_stuff = function() {
        var velIncX = 0.05;

        if (g.dude.dir) {
            g.dude.face_dir = g.dude.dir;
            g.dude.vel[0] += velIncX * g.dude.dir;
        } else {
            g.dude.vel[0] *= 0.8;
            if (Math.abs(g.dude.vel[0]) < 0.05) {
                g.dude.vel[0] = 0;
            }
        }

        g.current_scroll += g.tempo;
        g.dom.background.scrollLeft(g.current_scroll);

        var currentTimeBlocks = g.songs[g.song].time_map_starts[parseInt((g.current_scroll + $(window).width() / 2) / g.block_scale, 10)];
        if (currentTimeBlocks && currentTimeBlocks.length) {
            $.each(currentTimeBlocks, function(i, $block){
                $block.addClass('highlighted');
            });
        }

        var currentTimeBlocksOff = g.songs[g.song].time_map_finish[parseInt((g.current_scroll + $(window).width() / 2) / g.block_scale, 10)];
        if (currentTimeBlocksOff && currentTimeBlocksOff.length) {
            $.each(currentTimeBlocksOff, function(i, $block){
                $block.removeClass('highlighted');
            });
        }

        g.dude.vel[1] += g.gravity;

        if (g.dude.vel[0] > g.dude.vel_max[0]) g.dude.vel[0] = g.dude.vel_max[0];
        if (g.dude.vel[0] < g.dude.vel_min[0]) g.dude.vel[0] = g.dude.vel_min[0];
        if (g.dude.vel[1] > g.dude.vel_max[1]) g.dude.vel[1] = g.dude.vel_max[1];
        if (g.dude.vel[1] < g.dude.vel_min[1]) g.dude.vel[1] = g.dude.vel_min[1];

        var newPos = [
            g.dude.pos[0] + g.dude.vel[0],
            g.dude.pos[1] + g.dude.vel[1]
        ];

        if (g.dude.on_ground) {
            if (g.dude.vel[0] === 0) {
                walkCycle = 0;
                g.dude_set_sprite(g.dude.face_dir < 0 ? g.dude.sprite_states.STANDLEFT : g.dude.sprite_states.STANDRIGHT);
            } else {
                walkCycle += 0.5;
                if (walkCycle >= 3) walkCycle = 0;
                g.dude_set_sprite(
                    (g.dude.vel[0] < 0 ? g.dude.sprite_states.RUNLEFT1 : g.dude.sprite_states.RUNRIGHT1) + (walkCycle >> 0)
                );
            }
        } else {
            walkCycle = 0;
            g.dude_set_sprite(g.dude.face_dir < 0 ? g.dude.sprite_states.JUMPLEFT : g.dude.sprite_states.JUMPRIGHT);
        }

        g.dude.pos = g.helpers.dude_collision_new(g.dude.pos, newPos);

        if (g.dude.pos[0] != newPos[0]) g.dude.vel[0] = 0;
        if (g.dude.pos[1] != newPos[1]) g.dude.vel[1] = 0;

        if (g.dude.pos[1] > g.songs[g.song].collisions.length) g.dude.pos[1] = g.starting_block_y;

        g.dom.dude.css({
            left: g.dude.pos[0]*g.block_scale,
            bottom: g.songs[g.song].collisions.length * g.block_scale - g.dude.pos[1] * g.block_scale
        });

        g.dom.camera.css({
            //left: ($(window).width() / 2) - g.dude.css.left,
            top: (((- g.dude.pos[1]) * g.block_scale) - $(window).height() / 2)
        });
    };

    g.draw_ground = function(fullBlocks) {
        var i, j, k, l, c;

        g.songs[g.song].time_map_starts = {};
        g.songs[g.song].time_map_finish = {};

        for (i in g.songs[g.song].collisions) {
            for (j = 0; j < g.songs[g.song].collisions[i].length; j++) {
                if (g.songs[g.song].collisions[i][j] === 1) {
                    k = 0;
                    if (fullBlocks) {
                        while (g.songs[g.song].collisions[i][j + k] === 1) {
                            k++;
                        }
                        k--;
                    }
                    l = {
                        note: {
                            pitch: g.songs[g.song].lowest_pitch + i
                        },
                        rect: [
                            j * g.block_scale,
                            (g.songs[g.song].collisions.length - i) * g.block_scale,
                            (((j + (k + 1)) - j) * g.block_scale) - (2 * g.block_border_width),
                            g.block_scale - (2 * g.block_border_width)
                        ]
                    };
                    if (l.rect[0] < 20000) { //TODO - dynamically load the part of the ground we need
                        if (l.rect[0] > g.end) {
                            g.end = l.rect[0];
                        }
                        //c = l.note.color ? l.note.color : 'rgba(100, 200, ' + (30 * (l.note.pitch % 12)) + ', 1)'; //green
                        c = l.note.color ? l.note.color : 'rgba(' + (30 * (l.note.pitch % 12)) + ', 100, 200, 1)'; //purple
                        l.dom = $('<div/>')
                            .addClass('block')
                            .css({
                                left: l.rect[0],
                                bottom: l.rect[1],
                                width: l.rect[2],
                                height: l.rect[3],
                                border: g.block_border_width + 'px solid ' + c,
                                borderRadius: g.block_scale + 'px'//,
                                //boxShadow: '0px 0px ' + g.block_scale + 'px ' + c + ', inset 0px 0px ' + parseInt(g.block_scale * 0.85, 10) + 'px ' + c
                            })
                            .data('ground', l)
                        ;

                        g.dom.background.append(l.dom);

                        if (!g.songs[g.song].time_map_starts[j]) {
                            g.songs[g.song].time_map_starts[j] = [];
                        }
                        g.songs[g.song].time_map_starts[j].push(l.dom);

                        if (!g.songs[g.song].time_map_finish[(j + (k + 1))]) {
                            g.songs[g.song].time_map_finish[(j + (k + 1))] = [];
                        }
                        g.songs[g.song].time_map_finish[(j + (k + 1))].push(l.dom);
                    }
                    j = j + k;
                }
            }
        }


        g.dom.song_background.css({
            left: 1184,
            width: (g.songs[g.song].collisions[0].length * g.block_scale) - 1184
        });
    };

    $.extend($.easing, {
        easeInSine: function (x, t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        }
    });

    g.first_time_going = true;

    g.setup_key_handlers = function() {
        $(document)
            .keydown(function(e){
                switch (e.which) {
                    case 39: // right
                        g.dude.dir = 1;
                        if (g.first_time_going) {
                            console.log('first!');
                            g.dom.camera.stop().animate({ left: 0 }, 400 * g.songs[g.song].tempo, 'easeInSine', function(){
                                g.tempo = g.songs[g.song].tempo;
                            });
                            g.first_time_going = undefined;
                        }
                    break;
                    case 37: // left
                        g.dude.dir = -1;
                    break;
                    case 38: // up
                        if (g.dude.on_ground) {
                            g.dude.vel[1] = g.dude.vel_min[1];
                        }
                    break;
                    case 32: //spacebar
                        //if (g.dev_mode) {}
                        g.toggle_pause();
                    break;
                    case 67: //c is for color :)
                        g.cycle_theme();
                    break;
                }
                //console.log(e.which)
            })
            .keyup(function(e){
                switch (e.which) {
                    case 39: // right
                        if (g.dude.dir === 1) {
                            g.dude.dir = 0;
                        }
                    break;
                    case 37: // left
                        if (g.dude.dir === -1) {
                            g.dude.dir = 0;
                        }
                    break;
                }
            })
        ;
    };

    g.setup_window_resize = function() {
        $(window).resize(function(){
            g.dom.camera.css({
                height: g.songs[g.song].collisions.length * g.block_scale + $(window).height()
            });
        }).resize();
    };

    g.cycle_theme = function() {
        g.theme = g.themes[(g.themes.indexOf(g.theme) + 1) % g.themes.length];
        $('html').get(0).className = g.theme;
    };

    g.toggle_pause = function() {
        g.pause = !g.pause;
    };


    // Animations

    g.animations = {};

    g.animations.block_dude_collision = function(block, offset) {
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


    // Helper functions

    g.helpers = {};

    g.helpers.dude_collision_new = function(pos1, pos2) {
        var oldX = pos1[0];
        var oldY = pos1[1];
        var newX = pos2[0];
        var newY = pos2[1];

        var collision, xAdjust = 0;

        var space = 1/g.block_scale;

        g.dude.on_ground = false;

        if (oldY != newY) { // moving vertically
            if (newY > oldY) { // moving down
                // lower left collision
                collision = g.helpers.blocking(newX + space, newY + 1);
                if (collision && !g.helpers.blocking(newX + space, newY)) {
                    newY -= collision[1];
                    g.dude.on_ground = true;
                }

                // lower right collision
                collision = g.helpers.blocking(newX + 1-space, newY + 1);
                if (collision && !g.helpers.blocking(newX + 1-space, newY)) {
                    newY -= collision[1];
                    g.dude.on_ground = true;
                }

                if (g.dude.on_ground === true) {
                    //TODO - map collision back to block! :(

                    //g.animations.block_dude_collision(g.dom, (x1 + 0.5 * w1) - (x2 + 0.5 * w2));
                }
            // moving up
            } else {

                // upper left collision
                collision = g.helpers.blocking(newX + space, newY);
                if (collision && !g.helpers.blocking(newX + space, newY + 1)) {
                    newY += (1 - collision[1]);
                }

                // upper right collision
                collision = g.helpers.blocking(newX + 1 - space, newY);
                if (collision && !g.helpers.blocking(newX + 1 - space, newY + 1)) {
                    newY += (1 - collision[1]);
                }
            }

        }
        // moving horizontally
        if (oldX != newX) {

            // moving right
            if (newX > oldX) {

                // lower right collision
                collision = g.helpers.blocking(newX + 1, newY + 1-space);
                if (collision) {
                    newX -= collision[0];
                }

                // upper right collision
                collision = g.helpers.blocking(newX + 1, newY);
                if (collision) {
                    newX -= collision[0];
                }

            // moving left
            } else {

                // lower left collision
                collision = g.helpers.blocking(newX, newY + 1-space);
                if (collision) {
                    newX += (1 - collision[0]);
                }

                // upper left collision
                collision = g.helpers.blocking(newX, newY);
                if (collision) {
                    newX += (1 - collision[0]);
                }
            }
        }

        return [newX, newY];
    };

    g.helpers.blocking = function(x, y) {
        var tx = x >> 0;
        var ty = y >> 0;

        if (g.songs[g.song].collisions[ty] && (g.songs[g.song].collisions[ty][tx] || typeof g.songs[g.song].collisions[ty][tx] == 'undefined')) {
            return [x - tx, y - ty];
        }
    };


    // Start the g

    g.init();

});