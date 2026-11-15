# SafheGardan: A record player for the phone

> SafheGardan, a prototype by Sid Jameson: crates, a needle drop and real crackle on the phone, playing 28,160 public-domain 78 rpm sides. Web, Android and iOS from one codebase.

Page: https://sidj.work/safhegardan/
Author: Sid Jameson (https://sidj.work/)

Built on my own Web, Android and iOS prototype 2026

# SafheGardan صفحه‌گردان, Persian for “record player”

Streaming made music instant and weightless: a search box and a list that never ends. I missed what happens around a record. Flipping through a crate, sliding the disc out of its sleeve, dropping the needle, the crackle before the first note. **SafheGardan tries to bring that ritual back on a phone**, with Persian, English and Turkish records side by side.

[Try the web version ](https://saeed-jam.github.io/safhegardan-web/)

Idea, design, the 3D scene, the sound, the apps and the backend: me. A prototype, not on any store yet.

- **28,160:** public-domain 78 rpm sides it can play, crackle and all
- **3:** platforms from one codebase: web, Android and iOS
- **12:** records to a crate, with real album covers
- **6 days:** from the first commit to the public web build, 5 to 10 October

_Image: SafheGardan on a wide screen: a wooden turntable with a record playing, the track list beside it_

The deck: a record on the platter, its sleeve beside it, the side’s tracks on the right.

## The path

How it went from a question about sound to a working app, including the wall I hit and the turn I took.

Step 1

### Can a phone sound like a record?

The first thing I built was the sound, not the screen. Even noise sounds fake, so the crackle is random: sometimes it dips the music, sometimes it clears, the way real wear does. The needle lands on the lead-in groove and the music rises out of the noise.

Step 2

### A room, not a box

The first 3D scene sat in a frame and looked artificial. I took the frame away and rebuilt it as a studio: wood and veneer, warm lamp light, depth of field, ambient occlusion, a camera you can orbit and zoom, crates you flick through with your thumb.

_Image: Three wooden crates of records in the 3D scene_

Step 3

### Crates of records people know

Famous Persian, English and Turkish albums with their real covers and track lists, twelve to a crate, extras spilling into the next one.

The wall

### Music you can’t play

I checked 32 albums on SoundCloud by hand. Official uploads give a 30-second preview or nothing through the API. The Persian albums exist only as fan re-uploads, and none carry a licence that lets you add a vinyl effect. That’s not something to build a product on.

The turn

### Records that are free to play

The Internet Archive has digitised 187,021 sides of 78 rpm shellac. The 28,160 from 1925 or earlier are in the US public domain, so the app may stream them and alter their sound. Artists’ own uploads on Audius came next, with the effect only on Creative Commons tracks and a link back to every artist.

Step 4

### Press your own

A studio for making a record: choose the size and speed, 7″ to 12″ or 10″ shellac, watch it pressed with stampers and steam, sleeved and jacketed, then sent to your crate. A shop of turntables and a community feed of shared pressings came with it.

_Image: The studio: picking a blank record and its size and speed_

Step 5

### Ship something testable

One web app, wrapped as an Android app and an iOS app with a native audio bridge, plus a web build on GitHub Pages refreshed on every commit.

### Why public domain, in one chart

Most of the world’s recorded music can’t legally be altered in an app without a licence. Old shellac can. The cut-off decides everything: recordings get 100 years of US copyright, so **1925 and earlier is fair game**, and 1926 to 1949 is left out on purpose.

78 rpm collection 313,752

Great 78 Project 187,021

1925 or earlier 28,160

Counted through the Internet Archive’s own API, 6 October 2026.

## On a phone

Portrait first, with a sheet that folds down to its handle so the turntable can fill the screen. A dark mode with a warm lamp.

_Image: The Persian crate on a phone_

The Persian crate.

_Image: A record playing on a phone_

On the platter, with the side’s tracks.

_Image: The studio on a phone_

Pressing your own: size, speed, price.

_Image: The deck in dark mode_

Night mode.

## Where it is now

A working prototype. The next idea is the one it was heading for from the start: a place where people press, buy and sell their own records.

_Image: The turntable shop_

The turntable shop.

The deck.

three.js Web Audio Internet Archive API Audius API Python backend (SQLite) Android WebView shell iOS WKWebView shell GitHub Pages
