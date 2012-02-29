#!/usr/bin/python

import midi
import json
import pprint

import sys
import pygame

#def dictify(d):
#    return dict((name, getattr(d, name)) for name in dir(d) if not name.startswith('__'))

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
    pygame.init()
    pp = pprint.PrettyPrinter(indent=1)

    midi_dict = {}
    midi_data = midi.read_midifile("test.mid")

    # build up dict of note on and off events grouped by pitch
    for d in midi_data[1]:
        if is_note_event(d):
            n = note_event_dict(d)
            p = n['pitch']
            if p in midi_dict:
                midi_dict[p].append(n)
            else:
                midi_dict[p] = []

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

    # find pitch boundaries
    pitches = sorted(midi_dict.keys())
    lowest = pitches[0]
    highest = pitches[-1:][0]

    pp.pprint(midi_dict)

    #create the screen
    window = pygame.display.set_mode((640, 480))

    #draw a line - see http://www.pygame.org/docs/ref/draw.html for more
    pygame.draw.line(window, (255, 255, 255), (0, 0), (30, 50))

    #draw it to the screen
    pygame.display.flip()

    #input handling (somewhat boilerplate code):
    while True:
       for event in pygame.event.get():
          if event.type == pygame.QUIT:
              sys.exit(0)
          else:
              print event

init()