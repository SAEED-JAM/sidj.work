# Luys Map: Telegram app for outages in Yerevan

> Luys Map, built and run by Sid Jameson: every power, water and gas outage in Yerevan on one map, with alerts for the places you save. Six sources, a collector every 15 minutes, four languages.

Page: https://sidj.work/luys-map/
Author: Sid Jameson (https://sidj.work/)

Built on my own Telegram mini app and bot Yerevan, since October 2026

# Luys Map

Yerevan loses power, water and gas often, and the notices are scattered across utility websites and Telegram channels, mostly in Armenian. **Luys Map collects them, puts them on one map, and tells you before an outage reaches a place you care about.**

[Open Luys Map in Telegram {{ext}}](https://t.me/LuysMapBot) [News channel {{ext}}](https://t.me/luysmap)

Product, design, code, data, growth and operations: me. Six official sources, read every 15 minutes, in Armenian, Russian, English and Persian.

- **926:** people have started it; 602 used it in the last 30 days
- **11,316:** alerts sent, for 547 places people saved
- **3,300+:** power, water and gas outages mapped since April
- **15 → 2:** alerts a month for a typical place, after tuning on real data

The launch film I made for the channel, from real app screens.

## Who uses it

People in Yerevan who want to know before the lights, the tap or the stove go off: families, renters, people working from home, small shops.

No ads were bought. People arrive from the channel, from printed QR posters, from shared outage cards, and mostly by word of mouth: in one three-day stretch, 42 of 46 new people came with no campaign link at all.

**65%** came back in the last 30 days

- **926:** people started the bot
- **602:** used it in the last 30 days
- **547:** places saved for alerts
- **~21:** alerts per saved place so far

### New people each week

**44** 28 Sep

**540** 5 Oct

**97** 12 Oct

**64** 19 Oct

**83** 26 Oct

**98** 2 Nov

540 joined in the week of 5 October, the week the channel, the QR posters and the Instagram links went out. Since then, 60 to 100 new people a week with no ads, rising for three weeks in a row.

### The language people choose

Russian 559

English 117

Armenian 69

Persian 50

Of the 795 who picked a language; 131 more left before choosing. Seven in ten read the app in Russian, which is why every notice is parsed from Armenian and Russian sources and every string exists in all four languages.

## How it works

From a notice nobody reads to an alert you can act on, without anyone typing anything in.

**Sources**

The power and water utilities’ sites and channels, gas notices, city channels.

6 sources

**Collector**

A scheduled worker fetches every source and drops what it has seen before.

every 15 min

**Parser**

Reads Armenian and Russian notices into streets, house numbers, dates and times, including withdrawn and corrected ones.

per source

**Gazetteer**

My own index of Yerevan’s streets and 55,000 addressed buildings places each house on the map.

55k buildings

**Map and alerts**

The mini app shows it; the bot warns the evening before, an hour before, and when an emergency starts.

Telegram

## The app

One map for the whole city, your places on top, and the history of every street.

_Image: The Luys Map home: a map of Yerevan with outage markers, a saved home and filters for power, water and gas_

The city map, your saved places, and today, tomorrow and this week.

_Image: A planned power cut on a street: the time, a countdown and the streets and buildings it covers_

A planned cut: when, how long until it starts, and which buildings.

_Image: Insights for a saved home: the district ranks first of twelve for outages, last outage yesterday, twelve days with an outage in 180_

What a place has been through: its district’s rank and its own record.

## Features

Everything that shipped in the first month, each one because someone needed it.

◎

### One map, three networks

Power, water and gas, today, tomorrow and this week. Tap an outage for its streets; tap and hold anywhere to pick a spot.

⌂

### Saved places

Home, work, parents. Each watches about 250 m around it, with its own alert settings.

!

### Alerts with a picture

The evening before, an hour before, and right now for emergencies. Each alert carries a rendered card of the outage, and opens it in the app.

▦

### Exact buildings

Not just “Kentron”: the announced street, drawn as a band, with the buildings that are actually listed.

↻

### History and insights

Days with an outage in the last 180, the district’s rank among 12, the last time it happened here.

✋

### People’s reports

Report an outage from the app; it counts when 3 people within 250 m agree inside an hour.

◍

### Hotspot map

Where outages hit most, from all our history. Opened by invitation, with a short tour first.

₼

### Bills

Subscriber codes per saved place and a monthly reminder; pay buttons with provider logos, live only for a beta group.

✉

### A channel that writes itself

“Tomorrow in Yerevan” every night and a monthly report, posted automatically in the app’s own style.

### A house for every place

A list of outages is hard to read at a glance. So each saved place shows a small house. **Every network that works glows**: light runs along the wires, water through the pipes, the stove flame flickers. What’s out goes dark.

Eight rendered pictures cover every mix of power, water and gas. Try it: switch a network off.

_Image: The house with power, water and gas all working_

Everything works.

## Flows

The two paths that matter most: getting a new person to a saved place, and getting an outage to the right person at the right time.

### First run: onboarding ends on picking your home

- **Language** Armenian, Russian, English or Persian, guessed from Telegram
- **The map** Today’s outages, live
- **History** How often your area is hit
- **Alerts** What you’ll get and when
- **Pick your home** The step that makes the rest work

People who leave without an address get one nudge four days later, in the evening, led by this week’s outage count near them. Onboarding shows once per person, remembered across devices.

### Every 15 minutes: from notice to alert

- **New notice** Found by the collector
- **Placed** Streets and buildings matched
- **Matched** Against 547 saved places
- **Pictured** An outage card rendered in a headless browser
- **Sent on time** Evening before, hour before, or now

## Tests and experiments

Small product, real users, so every change that could cost people got tested, rolled out in stages, or measured first.

A/B test

### Where to ask for a phone number

- **Question:** Does asking for the phone up front scare people off before they save an address?
- **Variants:A** in onboarding, step two. **B** right after the first saved place. Every new person is fixed in one group.
- **Decides:** Saved places with alerts switched on. Guardrail: phone numbers may not fall by more than half.
- **Rigour:** Decision rule and a sample of 400 per group agreed before any result; a two-proportion z-test gives the verdict automatically in the admin panel.

So far: 264 people in A, 258 in B

Place with alerts on decides **A 63%B 60%** no real difference

Saved a place **A 69%B 69%** same

Gave a phone number guardrail **A 54%B 29%** half as many

**What it says:** asking for the phone up front doesn’t scare people off. Moving it later brought no more saved places and lost almost half the numbers. The rule says keep going to 400 per group, but A is the likely keeper.

Staged rollout

### People’s outage reports at 50%

- **Risk:** Crowd reports can be wrong, or abused, and put a false outage on someone’s house.
- **Setup:** On for half of all people by a stable hash of their id, plus anyone switched on by hand. A crowd needs 3 reports within 250 m in an hour.
- **So far:64 reports** from people. Watching how often crowds match official notices before going to 100%.

Simulation

### Replaying a month to fix alert noise

- **Signal:** A user said the alerts were too many.
- **Method:** Replayed 30 days of real outages against every saved place to see where the alerts came from.
- **Result:** The noise was neighbours’ emergencies. New default: 15 alerts a month down to 2 for a typical place.

Growth loop

### An invite that unlocks insights

- **Setup:** One place is free. Insights unlock with one invite, shown first with a progressive blur so people see what they’d get.
- **Timing:** The invite is offered after the fifth alert, when the app has already proved itself.
- **So far:22 people** joined through an invite. Modest: word of mouth outside the app does more than the loop inside it.

Demand test

### An invite-only hotspot map

- **Setup:** Everyone sees the button and a four-scene tour with real numbers; access is by request, answered from the bot.
- **Why:** Requests show who wants it, and why, before it opens to all.

Instrumentation

### What makes people leave

- **Setup:** Every time someone blocks the bot, the last message they got before it is recorded.
- **Why:** So no message type quietly drives people away.
- **So far:115 people**, 12% of everyone, have blocked the bot at some point. Each block sits next to the message that came before it, so alert noise shows up as a pattern, not a guess.

### Alerts people can live with

A user wrote that the alerts were too many. Instead of guessing, I replayed **30 days of real outages** against every saved place.

The noise wasn’t the user’s own building. It was the neighbours’ emergencies. The new default watches about 250 m around a place, sends the evening notice for all of it, and keeps hour-before and emergency alerts for the building itself. A one-page tutorial in four languages showed existing users how to switch whole-district alerts off.

**15** alerts a month, before

**2** after the new default

### People as a sensor

Official notices miss emergencies. So anyone can report an outage from the app, but **one report doesn’t go on the map**. It takes 3 people within 250 m inside an hour.

When the official notice arrives, the report is confirmed, marked as back early, or kept as still out. A 25-second video in four languages introduced it to the people who have it.

## Where outages hit most

Every outage since April, laid on a daily grid. The redder, the more often.

It answers a question people have before they buy or rent a flat: which street goes dark every week?

_Image: A heat map of Yerevan's outages by district, reddest in Kentron and Erebuni_

The whole city.

_Image: A street-level heat map around Erebuni street_

Down to the street.

## Growth without ads

A channel that posts itself, printed posters with their own links, and cards people forward.

Every poster, sticker and Instagram post gets its own campaign code with a location, so the panel shows which corner of the city each new person came from.

_Image: The nightly channel post: Tomorrow in Yerevan, planned outages by district and hour_

Every night: tomorrow in Yerevan.

_Image: The monthly report: which district was left in the dark longest_

Every month: who was left in the dark longest.

_Image: A two-step tutorial for turning off whole-district alerts_

One-page tutorials, in four languages.

## Four languages

Armenian, Russian, English and Persian, every string in all four. Persian runs right to left.

Russian is what most people choose: 559 of the 795 who picked a language.

_Image: Luys Map in English_

English

_Image: Luys Map in Armenian_

Armenian

_Image: Luys Map in Russian_

Russian

_Image: Luys Map in Persian_

Persian

## Built with

One Cloudflare Worker serves the app, its API, the bot and a Persian admin panel with 18 pages: people, places, outages, alerts, reports, the A/B test, blocks and more.

Cloudflare Workers D1 (SQLite) Cron triggers Browser Rendering for alert pictures Telegram Mini Apps and Bot API Signed Telegram requests OpenStreetMap gazetteer Vanilla JavaScript Bun
