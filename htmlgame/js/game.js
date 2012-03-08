/*
    MIDIGAME
    by Adam Schwartz

    Contents
      - Configuration
      - Initialization
      - Setup
      - Engine
      - Sound
      - Animations
      - Helpers

    v1.0
*/


// Configuration

var game = {
        songs: {},
        dev_mode: false
    }
;

soundManager.url = '../htmlgame/swf/';
soundManager.debugMode = false; //game.dev_mode

$(function() {
    var g = game;


    // Initialization

    g.init = function() {
        g.setup.variables();
        g.setup.screen();
        g.setup.key_handlers();
        g.setup.window_resize();

        g.sound.init();
        g.engine.init();
    };


    // Setup

    g.setup = {};

    g.setup.variables = function() {
        //asw, mary
        g.song = 'asw';

        g.helpers.build_collision_array();
        g.collisions = g.songs[g.song].collisions;

        g.helpers.add_to_dom([
            'debug',
            'camera',
            'background',
            'intro',
            'song',
            'ground',
            'dude'
        ]);

        g.fps = 30;
        g.tick = 0;
        g.tempo = 0;
        g.pause = false;
        g.current_scroll = 0;

        g.block_scale = g.songs[g.song].scale;
        g.block_border_width = 2;
        g.starting_block_x = 3;
        g.starting_block_y = -30;

        g.themes = ['black', 'pink', 'grey', 'white'];
        g.theme = g.themes[0];

        g.gravity = 0.08;

        g.last_jump = 0;

        g.dude = {};
        g.dude.sprite_states = {
            JUMPLEFT:   0,
            RUNLEFT1:   1,
            RUNLEFT2:   2,
            RUNLEFT3:   3,
            STANDLEFT:  5,
            STANDRIGHT: 6,
            RUNRIGHT1:  7,
            RUNRIGHT2:  8,
            RUNRIGHT3:  9,
            JUMPRIGHT:  11
        };
        g.dude.vx = 0;
        g.dude.vy = 0;

        g.dude.pos = [g.starting_block_x, g.starting_block_y];
        g.dude.vel = [0, 0];

        //slower
        //g.dude.vel_min = [-0.4, -0.85];
        //g.dude.vel_max = [0.4, 0.8];

        //faster
        //g.dude.vel_min = [-0.7, -1.25];
        //g.dude.vel_max = [0.7, 1.2];

        //just right?
        //g.dude.vel_min = [-0.55, -1];
        //g.dude.vel_max = [0.55, 0.95];

        //even better
        g.dude.vel_min = [-0.55 * (g.songs[g.song].tempo / 10) * (g.block_scale / 32), -1];
        g.dude.vel_max = [0.55 * (g.songs[g.song].tempo / 10) * (g.block_scale / 32), 0.95];

        g.dude.dir = 0;
        g.dude.face_dir = 1;
        g.dude.on_ground = 0;
    };

    g.setup.screen = function() {
        if (!g.dev_mode) {
            g.dom.debug.hide();
        }

        //g.dom.dude.append('<img src="img/dudesprite32.png" />');

        g.helpers.dude_set_sprite(g.dude.sprite_states.JUMPRIGHT);

        g.dom.dude.css({
            height: g.block_scale,
            width: g.block_scale
        });

        g.dom.camera.css('left', ($(window).width() / 2) - ((g.starting_block_x + 0.5) * g.block_scale));

        setTimeout(function(){
            // TODO - make this animate instead
            g.dom.camera.css({
                top: (((- g.dude.pos[1]) * g.block_scale) - $(window).height() / 2)
            });
        }, 3000);

        g.engine.draw_ground();
    };

    g.setup.key_handlers = function() {
        $(document)
            .keydown(function(e){
                switch (e.which) {
                    case 39: // right
                        g.dude.dir = 1;
                        g.engine.start_game_motion();
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
                        g.helpers.toggle_pause();
                    break;
                    case 67: //c is for color :)
                        g.helpers.cycle_theme();
                    break;
                    case 72: //h is for HUD :)
                        g.dom.debug.toggle();
                    break;
                }
                //console.log(e.which);
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

    g.setup.window_resize = function() {
        $(window).resize(function(){
            g.dom.camera.css({
                height: g.collisions.length * g.block_scale + $(window).height()
            });
        }).resize();
    };


    // Engine

    g.engine = {};

    g.engine.init = function() {
        //TODO - switch to more sophisticated timer using setTimeout and Date()
        setInterval(function(){
            if (!g.pause) {
                g.engine.render();
                g.helpers.calculate_fps();
            }
        }, 1000 / g.fps);
    };

    g.engine.render = function() {
        g.tick += 1;
        g.engine.do_dude_stuff();
    };

    g.engine.start_game_motion = function() {
        if (g.game_motion_started) {
            return;
        }

        g.game_motion_started = true;

        g.dom.camera.stop().animate({ left: 0 }, 400 * g.songs[g.song].tempo, 'easeInSine', function(){
            g.tempo = g.songs[g.song].tempo * (g.block_scale / 32);
        });
    };

    g.engine.draw_ground = function() {
        var i, j, k, l, c, p;

        g.songs[g.song].time_map_starts = {};
        g.songs[g.song].time_map_finish = {};

        for (i in g.collisions) {
            for (j = 0; j < g.collisions[i].length; j++) {
                p = g.collisions[i][j];
                k = 0;
                if (p === 1 || p === 3) {
                    if (p === 1) {
                        while (g.collisions[i][j + k] === 1) {
                            k++;
                        }

                        if (g.collisions[i][j + k] !== 3) {
                            k--;
                        }
                    }

                    l = {
                        note: {
                            pitch: g.songs[g.song].lowest_pitch + i
                        },
                        rect: [
                            j * g.block_scale,
                            (g.collisions.length - i) * g.block_scale,
                            (((j + (k + 1)) - j) * g.block_scale) - (2 * g.block_border_width),
                            g.block_scale - (2 * g.block_border_width)
                        ]
                    };

                    if (l.rect[0] < 20000) { //TODO - dynamically load the part of the ground we need
                        c = l.note.color ? l.note.color : 'rgba(100, 200, ' + (30 * (l.note.pitch % 12)) + ', 1)'; //green
                        //c = l.note.color ? l.note.color : 'rgba(' + (30 * (l.note.pitch % 12)) + ', 100, 200, 1)'; //purple
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

                        //bottom piece
                        if (l.rect[2] > 5000) { // TODO - fix hack
                            g.dom.bottom_block = l.dom;
                        }

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

        g.dom.song.css({
            left: 1184,
            width: (g.collisions[0].length * g.block_scale) - 1184
        });
    };

    g.engine.do_dude_stuff = function() {
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

        // TODO - figure out how to move these two each loops into the if block which follows them
        var currentTimeBlocks = g.songs[g.song].time_map_starts[parseInt((g.current_scroll + $(window).width() / 2) / g.block_scale, 10)];
        if (currentTimeBlocks && currentTimeBlocks.length) {
            $.each(currentTimeBlocks, function(i, $block){
                $block.addClass('highlighted');
                g.sound.start();
            });
        }

        var currentTimeBlocksOff = g.songs[g.song].time_map_finish[parseInt((g.current_scroll + $(window).width() / 2) / g.block_scale, 10)];
        if (currentTimeBlocksOff && currentTimeBlocksOff.length) {
            $.each(currentTimeBlocksOff, function(i, $block){
                $block.removeClass('highlighted');
            });
        }

        var beatOffset = 36; //TODO - fix hack

        var beat = parseInt((g.current_scroll + $(window).width() / 2) / g.block_scale, 10) - beatOffset;

        if (g.last_beat === 0 || g.last_beat > 0 && g.last_beat !== beat) {
            g.last_beat = beat;

            if (g.last_beat % 4 === 0) {
                g.animations.flash_bottom_block();
            }
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
                g.helpers.dude_set_sprite(g.dude.face_dir < 0 ? g.dude.sprite_states.STANDLEFT : g.dude.sprite_states.STANDRIGHT);
            } else {
                walkCycle += 0.5;
                if (walkCycle >= 3) walkCycle = 0;
                g.helpers.dude_set_sprite(
                    (g.dude.vel[0] < 0 ? g.dude.sprite_states.RUNLEFT1 : g.dude.sprite_states.RUNRIGHT1) + (walkCycle >> 0)
                );
            }
        } else {
            walkCycle = 0;
            g.helpers.dude_set_sprite(g.dude.face_dir < 0 ? g.dude.sprite_states.JUMPLEFT : g.dude.sprite_states.JUMPRIGHT);
        }

        g.dude.pos = g.engine.dude_collision(g.dude.pos, newPos);

        if (g.dude.pos[0] != newPos[0]) g.dude.vel[0] = 0;
        if (g.dude.pos[1] != newPos[1]) g.dude.vel[1] = 0;

        if (g.dude.pos[1] > g.collisions.length) g.dude.pos[1] = g.starting_block_y;

        g.dom.dude.css({
            left: g.dude.pos[0] * g.block_scale,
            bottom: g.collisions.length * g.block_scale - g.dude.pos[1] * g.block_scale
        });

        /*
        g.dom.camera.css({
            //left: ($(window).width() / 2) - g.dude.css.left,
            top: (((- g.dude.pos[1]) * g.block_scale) - $(window).height() / 2)
        });
        */
    };

    g.engine.dude_collision = function(pos1, pos2) {
        var oldX = pos1[0],
            oldY = pos1[1],
            newX = pos2[0],
            newY = pos2[1],
            space = 1 / g.block_scale,
            collision
        ;

        g.dude.on_ground = false;

        // moving vertically
        if (oldY != newY) {

            // moving down
            if (newY > oldY) {

                // lower left collision
                collision = g.engine.blocking(newX + space, newY + 1);
                if (collision && !g.engine.blocking(newX + space, newY)) {
                    newY -= collision[1];
                    g.dude.on_ground = true;
                }

                // lower right collision
                collision = g.engine.blocking(newX + 1-space, newY + 1);
                if (collision && !g.engine.blocking(newX + 1-space, newY)) {
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
                collision = g.engine.blocking(newX + space, newY);
                if (collision && !g.engine.blocking(newX + space, newY + 1)) {
                    newY += (1 - collision[1]);
                }

                // upper right collision
                collision = g.engine.blocking(newX + 1 - space, newY);
                if (collision && !g.engine.blocking(newX + 1 - space, newY + 1)) {
                    newY += (1 - collision[1]);
                }
            }
        }

        // moving horizontally
        if (oldX != newX) {

            // moving right
            if (newX > oldX) {

                // lower right collision
                collision = g.engine.blocking(newX + 1, newY + 1-space);
                if (collision) {
                    newX -= collision[0];
                }

                // upper right collision
                collision = g.engine.blocking(newX + 1, newY);
                if (collision) {
                    newX -= collision[0];
                }

            // moving left
            } else {

                // lower left collision
                collision = g.engine.blocking(newX, newY + 1-space);
                if (collision) {
                    newX += (1 - collision[0]);
                }

                // upper left collision
                collision = g.engine.blocking(newX, newY);
                if (collision) {
                    newX += (1 - collision[0]);
                }
            }
        }

        return [newX, newY];
    };

    g.engine.blocking = function(x, y) {
        var tx = x >> 0,
            ty = y >> 0
        ;

        if (g.collisions[ty] && (g.collisions[ty][tx] || typeof g.collisions[ty][tx] == 'undefined')) {
            return [x - tx, y - ty];
        }
    };


    // Sound

    g.sound = {};

    g.sound.init = function() {
        soundManager.onready(function(){
            var i;

            for (i = 0; i < g.songs[g.song].tracks.length; i++) {
                soundManager.createSound({
                    id: g.song + i,
                    url: g.songs[g.song].base_auio_directory + g.songs[g.song].tracks[i],
                    volume: i > 0 ? 0 : 100
                });
            }
        });
    };

    g.sound.start = function() {
        if (g.first_play) {
            return;
        }

        g.first_play = true;

        g.last_beat = 0;

        var i;

        for (i = 0; i < g.songs[g.song].tracks.length; i++) {
            soundManager.play(g.song + i);
        }

        setTimeout(function(){
            soundManager.setVolume(g.song + 1, 100);
        }, 7000);

        setTimeout(function(){
            soundManager.setVolume(g.song + 2, 100);
        }, 12000);
    };


    // Animations

    g.animations = {};

    /*
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
    */

    g.animations.flash_bottom_block = function() {
        if (g.dom.bottom_block.hasClass('highlighted')) {
            g.dom.bottom_block.removeClass('highlighted');
        } else {
            g.dom.bottom_block.addClass('highlighted');
        }
    };


    // Helpers

    g.helpers = {};

    g.helpers.build_collision_array = function() {
        g.songs[g.song].collisions = _.map(g.songs[g.song].game_map, function(row){
            return _.map(row.split(''), function(cell){
                if (cell === ' ') {
                    return 0;
                }

                return parseInt(cell, 0);
            });
        });
    };

    g.helpers.add_to_dom = function(selectors) {
        g.dom = {};

        $.each(selectors, function(i, s){
            g.dom[s] = $('#' + s);
        });
    };

    g.helpers.dude_set_sprite = function(id) {
        g.dom.dude.scrollLeft(id * g.block_scale);
    };

    g.helpers.last_fps_time = (new Date()).getTime();

    g.helpers.calculate_fps = function() {
        var o = g.helpers.last_fps_time,
            n = (new Date()).getTime()
        ;

        g.dom.debug.html(parseInt((1000 / (n - o)) * 10, 10) / 10 + (g.last_beat ? '<br/>' + g.last_beat : ''));

        g.helpers.last_fps_time = n;
    };

    g.helpers.cycle_theme = function() {
        g.theme = g.themes[(_.indexOf(g.themes, g.theme) + 1) % g.themes.length];
        $('html').get(0).className = g.theme;
    };

    g.helpers.toggle_pause = function() {
        g.pause = !g.pause;

        if (g.pause) {
            soundManager.pauseAll();
        } else {
            soundManager.resumeAll();
        }
    };


    // Start the game

    g.init();

});