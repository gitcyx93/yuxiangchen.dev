---
title: How this site is built
summary: Hand-written pages, one build script, and plants drawn from the notes themselves.
date: 2026-11-19
kind: making
stage: seed
lang: en
---

This is the first note in the garden, so it is about the garden.

## No template

The site is hand-written HTML, CSS and JavaScript. There is no framework. One script, `build.mjs`, reads the Markdown files in `notes/` and writes plain pages. The only dependency is the library that turns Markdown into HTML.

An earlier version of this site was built on a framework, and I deleted it. A blog template assumes every post is finished. I wanted somewhere to keep things that are not.

## Every note is a plant

Each note carries a stage: seed, growing, or evergreen. The stage decides the shape of its plant. A seed is a sprout, a growing note is a stalk with leaves, an evergreen note is a tree. Longer notes grow taller. Build logs flower and study notes only grow leaves.

The details of each plant come from the note's file name, run through a small random number generator. The same note always grows the same plant, and no two notes share one.

The plants are drawn when the site is built, so the garden shows up without JavaScript. The script in the browser only adds movement: plants lean toward the pointer.

## Not done yet

- The garden is nearly empty. That part is on me.
- Plants do not change with the seasons or the time of day.
