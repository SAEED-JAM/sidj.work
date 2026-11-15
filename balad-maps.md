# Balad Maps: Search & Discovery: a case study by Sid Jameson

> Redesigning search in Balad Maps so results show what kind of place you’re after, and “no results” is no longer a dead end. A case study by Sid Jameson.

Page: https://sidj.work/balad-maps/
Author: Sid Jameson (https://sidj.work/)

Balad Maps · Search & Discovery V2.0

# Search that understands what you’re after

Most people opened Balad to find a place, not to get directions. Search was the real front door of the app, and it wasn’t built for that job.

- **Role:** Senior Product Designer
- **Product:** Iran’s Farsi-language navigation and local discovery app
- **Scope:** Search page, result components, POI cards, empty states
- **Shipped:** Search & Discovery V2.0
- **+15%** POI engagement
- **−8%** Search bounce rate

The world before

## Every result looked the same

People came looking for something specific: a pharmacy open past nine, a restaurant nearby, a park they hadn’t been to yet. Under the routing sits a searchable map of Iran’s places, and that search layer was the actual reason the app got opened.

Yet every search returned the same generic layout. A pharmacy looked identical to a park, a restaurant no different from a repair shop. Nothing suggested the app understood what kind of place you wanted.

_Image: After: history match first, results with photo and status_

_Image: Before: flat undifferentiated list_

Before After

### From a flat list to results with context

Before: an undifferentiated list. After: the history match comes first, and every result carries a photo and an open/closed status.

The everyday friction

## Three kinds of friction

Search bounce rate was creeping up, because the app kept asking people to do work it should have done for them.

### Dead ends

Search for something missing and the search just stopped. No suggestion, no alternative, no next move.

### Detours to act

Tap a card, get pushed to a detail page, do the thing, then find your way back to browsing.

### No memory

No idea what you searched last week, and no answer to the first question: is it open right now?

The trigger

## Four goals and one reframe

01

### More relevant results

02

### Fewer abandoned searches

03

### Engagement with what’s found

04

### A rethink of how results look

“No results” had always been an edge case. I started treating it as a design problem in its own right.

The wider landscape

## How others handle local search

### Google Maps

Simplified what a result even looks like, betting that a cleaner map earns more trust than a denser one.

### Citymapper

Treated discovery as something that should reward curiosity, tying places to a payoff instead of static text.

Neither was built for Farsi speakers or Iranian places. What we took from both: put the context people need into the result itself, and give them a reason to keep exploring after the first one.

The work

## Components built for what you search

I rebuilt the search page around components tailored to the type of place, so a restaurant shows what a restaurant needs and a service shows what a service needs. Search history personalizes what surfaces first. Opening hours moved into the result itself.

_Image: After: trending section_

_Image: Before: raw history only_

Before After

Empty search

### Something to explore before you type

An empty search used to open onto raw history. A Trending section now gives people a reason to browse without a query.

_Image: No results screen with categories_

No results

### A dead end became a fork

The “no results” screen now offers category browsing (gas station, restaurant, pharmacy and more), plus a way to add the place if it’s genuinely missing from the map.

_Image: After: actions on the card_

_Image: Before: static card_

Before After

POI cards

### Act without leaving the map

Cards used to show information and nothing else. Navigate, Call and Save now sit right on the card, and a list-view toggle opens up browsing beyond the map.

_Image: After: comparable details_

_Image: Before: rating and distance only_

Before After

List view

### Built for comparing two or three places

People kept weighing places against each other using single cards. The list view surfaces the details that decide it, like delivery, parking and restrooms, with one-tap call and navigate.

The return

## What changed after launch

- +15%

POI engagement

### People used the cards

Engagement with place cards rose after the action buttons and the new card design shipped.

- −8%

Search bounce rate

### Fewer people gave up

It shipped with the reformatted results, the new empty states and the list view.

Relevance is often a presentation problem before it’s ever a ranking problem.

Opening hours in the results and category browsing after a failed search needed no smarter matching, only better presentation.
