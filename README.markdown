# midigame


An awesome midi-based music adventure. (In the works...)

## Playing the game

Open htmlgame/index.html in your browser. (Note: The sound will not work unless you serve up this directory with a server like Apache or nginx. This is due to a limitation of Flash (via soundmanager2).)

![MIDIGAME V1](https://github.com/adamschwartz/midigame/raw/master/htmlgame/img/screenshots/midigame-v1.png)

## Using MIDI Reader

The MIDI Reader is used to convert a midi file into a playable game.

### Pip

Right now this just installs Mercurial which is necessary to setup PyGame.

    pip install requirements.pip

### Install python-midi

    git clone https://github.com/vishnubob/python-midi.git
    cd python-midi
    python setup.py install

### Install PyGame

    brew install sdl sdl_image sdl_mixer sdl_ttf smpeg portmidi
    pip install hg+http://bitbucket.org/pygame/pygame

### Running the MIDI Reader

    python midi_reader.py

That's it!

## Copyright / License

- All midi / music / sound / songs / artwork:  &copy; 2012 Adam Schwartz.
- Game code (midi_reader.py, game.js):  MIT License.