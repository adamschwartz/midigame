#!/usr/bin/python

import midi
import pprint
import sys
import pygame

midi_file = 'mary.mid'
scale_y = 20
scale_x = 0.5

'''
midi_file = 'plus.mid'
scale_y = 5
scale_x = 0.105
'''

'''
midi_file = 'brickone.mid'
scale_y = 5
scale_x = 0.1
'''

pp = pprint.PrettyPrinter(indent=1)

window_width = 800
window_height = 600

# create the screen
window = pygame.display.set_mode((window_width, window_height))

# store global game data in game_map
game_map = {
    'ground': []
}

def is_note_on_event(d):
    return str(d)[:16] == 'midi.NoteOnEvent'

def is_note_off_event(d):
    return str(d)[:17] == 'midi.NoteOffEvent'

def is_note_event(d):
    return is_note_on_event(d) or is_note_off_event(d)

def note_event_dict(d):
    return {
        'on': is_note_on_event(d),
        'channel': d.channel,
        'tick': d.tick,
        'pitch': d.data[0],
        'velocity': d.data[1]
    }

def init():
    midi_dict = {}
    midi_data = midi.read_midifile(midi_file)

    # build up dict of note on and off events grouped by pitch
    prev_tick = 0
    for d in midi_data[1]:
        if is_note_event(d):
            n = note_event_dict(d)
            n['tick'] += prev_tick
            p = n['pitch']
            if p not in midi_dict:
                midi_dict[p] = []
            midi_dict[p].append(n)
            prev_tick = n['tick']

    print len(midi_dict)

    # sort each pitch's list of note events in time
    for p, n in midi_dict.iteritems():
        midi_dict[p] = sorted(n, key=lambda k: k['tick'])

    # remove duplicates
    for p, n in midi_dict.iteritems():
        prev = False
        new_n = []
        for d in n:
            if prev != d:
                new_n.append(d)
            prev = d
        midi_dict[p] = new_n

    # find pitch boundaries and set basic parameters
    pitches = sorted(midi_dict.keys())
    lowest = pitches[0]
    #highest = pitches[-1:][0]

    pp.pprint(midi_dict)

    # generate map
    for p, n in midi_dict.iteritems():
        left_x = velocity = close_block = False
        every_other = True  # midi is dumb, so noteOn/noteOn needs to be treated as noteOn/noteOff
        for d in n:
            if close_block:
                right_x = d['tick'] * scale_x
                left_y = window_height - (((p - (lowest - 1)) * scale_y))
                if every_other:
                    game_map['ground'].append({
                        'rect': (left_x, left_y, (right_x - left_x) - 20, scale_y),
                        'note': {
                            'velocity': velocity,
                            'pitch': p
                        }
                    })
                every_other = not every_other
                if not d['on']:
                    close_block = False

            left_x = d['tick'] * scale_x
            velocity = d['velocity']
            close_block = True

    pp.pprint(game_map['ground'])

    setup_pygame()

def setup_pygame():
    game_time = 0 - window_width + 50
    pygame.init()

    pygame.mixer.init()
    pygame.mixer.music.load(midi_file)
    pygame.mixer.music.play()

    #input handling (somewhat boilerplate code):
    while True:
        game_time += 3.6
        update(game_time)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit(0)
            #else:
                #print event

def update(time):
    # blacken out screen
    pygame.draw.rect(window, (0, 0, 0), (0, 0, window_width, window_height))

    # draw game map
    for g in game_map['ground']:
        rect = list(g['rect'])
        rect[0] -= round(time)
        rect = tuple(rect)
        pygame.draw.rect(window, (0, 100, (g['note']['pitch'] % 12) * 20), rect)

    #draw it to the screen
    pygame.display.flip()

init()