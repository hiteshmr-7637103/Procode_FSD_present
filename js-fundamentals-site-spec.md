# JS Fundamentals Interactive Learning Site — Build Spec

## Overview
A single-page frontend-only website teaching JavaScript fundamentals to junior
college students, for a coding club (ProCode) session. Style: like W3Schools/
GeeksforGeeks, but themed like a colorful school textbook — playful, not
corporate. Content-light, visual-heavy, code-runnable.

## Tech
- Plain HTML/CSS/JS single page app (no backend, no build step needed)
- In-browser JS code execution (sandboxed iframe or a safe eval approach) so
  users can click "Run" on a snippet and see real output
- Smooth scroll / sidebar navigation between sections (like a doc site)

## Global Design Direction
- Theme: colorful "textbook" aesthetic — think chapter dividers, doodles,
  sticky-note style callouts, hand-drawn-ish icons/illustrations
- NOT minimalist corporate. Bright accent colors per section, playful type
  pairing (a friendly display font for headings + clean readable font for body)
- Each section should feel like a "page" or "chapter" with its own color accent
- Sidebar or top nav showing all 11 sections, current section highlighted,
  scroll-spy behavior
- Mobile responsive

## Content Rule (applies to every section)
- Definition text: 2–3 sentences MAX
- 1 illustration/diagram per concept (SVG or simple custom graphic — no stock
  photos, keep it diagram/doodle style)
- 1 runnable code snippet where applicable, with a "Run ▶" button and an
  output console below it showing real result
- No walls of text anywhere

## Sections & Content (in this exact order)

1. **History of JS** — this is a full dedicated page/section, not a throwaway
   intro. Build it as a proper horizontal or vertical scrolling timeline with
   real images at each milestone. Content to include, in order:

   - **1990 — The web needed life.** Tim Berners-Lee's WorldWideWeb browser
     existed but pages were static documents, no interactivity.
   - **1994 — Netscape dominates.** Netscape Navigator has ~80% browser market
     share. Include the Netscape Navigator logo/screenshot.
   - **May 1995 — Brendan Eich, 10 days.** Netscape hires Brendan Eich to
     build a scripting language ("Scheme in the browser"), under pressure to
     beat Microsoft. He builds it in ~10 days. Include a photo of Brendan
     Eich if available online.
   - **The name changes — Mocha → LiveScript → JavaScript.** Explain this was
     a marketing move to ride Java's popularity, even though JS and Java are
     unrelated languages. This naming confusion is a great "fun fact" callout
     box — students always find it funny/memorable.
   - **August 1996 — Microsoft's JScript.** Microsoft reverse-engineers JS for
     Internet Explorer but has to call it JScript for licensing/legal
     reasons (Netscape owned the "JavaScript" trademark). This is the
     compatibility chaos moment — include an image of a "Best viewed in
     Netscape" or "Best viewed with Internet Explorer" badge (these retro
     browser badges were common on 90s websites — search for them, they're a
     great nostalgic/funny visual here), and if you can find a meme about
     the browser wars / "works on my browser" incompatibility era, include
     it as a callout — keep it light, this is a great spot for humor to keep
     students engaged.
   - **1997 — ECMA standardization.** Because of the Netscape vs Microsoft
     incompatibility mess, JavaScript gets submitted to ECMA International
     to become a standard (ECMA-262 / ECMAScript), so all browsers implement
     the same language spec. Explain simply: "so your JS code works the same
     everywhere, no matter which browser."
   - **2005 — AJAX era.** jQuery and AJAX let pages update without full page
     reloads — the start of JS becoming a "real" application language, not
     just a page decorator.
   - **2009 — Node.js is born.** JS escapes the browser, can now run on
     servers — ties directly into what the students learn in your Node
     session on Day 2. Worth calling out explicitly as a bridge.
   - **2015 — ES6/ECMAScript 2015.** Major modern JS overhaul — `let`/`const`,
     arrow functions, promises, classes. This is the JS most of what they'll
     learn in this course is built on.
   - **Today.** JS runs in browsers, servers (Node), mobile apps, desktop
     apps — one language everywhere. Good closing beat to end the timeline
     on an "aha, this is why it matters" note.

   No code snippet needed for this section. Every milestone should have a
   small real image/logo/screenshot next to it (see Image Sourcing section
   below) — this section should NOT be plain text on a timeline line; it
   should feel like flipping through an illustrated history page.

2. **Need for JS**
   - Side-by-side visual: static HTML page (boring) vs JS-powered interactive
     page (dynamic) — before/after style
   - No code snippet needed

3. **Execution Context**
   - Diagram showing two phases: Memory Creation Phase vs Execution Phase,
     as two labeled boxes/columns
   - Optional tiny code snippet illustrating variable/function hoisting setup

4. **Hoisting**
   - Runnable snippet (standard var hoisting example):
     ```js
     console.log(name); // undefined
     var name = "John";
     console.log(name); // John
     ```

5. **TDZ (Temporal Dead Zone)**
   - Runnable snippet (standard let/TDZ example):
     ```js
     console.log(age); // ReferenceError
     let age = 25;
     ```

6. **Scope of Execution Context**
   - Diagram: nested boxes — Global EC containing Function EC(s)

7. **Call Stack**
   - Step-through animated diagram: functions pushing/popping off a stack
     as they're called (can be a simple JS-driven animation, click "Next
     Step" to advance)

8. **Window Object**
   - Simple diagram: `window` object at the top, with global variables/
     functions/DOM hanging off it as child nodes

9. **Lexical Environment & Scope Chain**
   - Diagram: nested function boxes showing chain lookup
   - Runnable closure snippet (standard counter example):
     ```js
     function makeCounter() {
       let count = 0;
       return function () {
         count++;
         return count;
       };
     }
     const counter = makeCounter();
     console.log(counter()); // 1
     console.log(counter()); // 2
     ```

10. **Callback**
    - Runnable snippet (standard callback example):
      ```js
      function greeting(name) {
        console.log("Hello " + name);
      }
      function processInput(callback) {
        let name = "John";
        callback(name);
      }
      processInput(greeting);
      ```

11. **Event Loop**
    - The centerpiece — animated/step diagram showing: Call Stack + Web APIs
      + Callback Queue + Event Loop arrow cycling between them
    - Runnable snippet (standard event loop / setTimeout example):
      ```js
      console.log("Start");
      setTimeout(function () {
        console.log("Timeout callback");
      }, 0);
      console.log("End");
      ```
      Output panel should show `Start, End, Timeout callback` in order,
      ideally with a short animated trace of why

## Interaction Requirements
- "Run" button per snippet → executes the code and shows output below it
  (console.log output captured and displayed, errors shown in red)
- Sidebar nav with scroll-spy (highlights current section as user scrolls)
- Smooth section-to-section scroll or transition
- Each section visually distinct (color accent / chapter divider) but
  cohesive overall theme

## What NOT to include
- No backend, no database, no user accounts
- No long paragraphs or dense text blocks
- No generic stock-photo style images — keep illustrations diagram/doodle
  style consistent with the textbook theme
- No unrelated JS topics outside the 11 sections listed above

## Image & Asset Sourcing
This is important — do not use placeholder boxes, emoji-as-icons, or generic
stock illustration packs for things that have a real, recognizable visual
identity. Actually search the web and pull real images for:
- Netscape Navigator logo and a screenshot of the old browser UI
- A photo of Brendan Eich
- "Best viewed in Netscape / Internet Explorer" retro browser badges from the
  90s (these are iconic — search for them specifically)
- Internet Explorer / JScript era screenshots or logos
- Node.js logo (for the "JS escapes the browser" beat)
- Any well-known meme related to browser compatibility wars, if you find one
  that's clean and appropriate for a college classroom setting
- The JS logo itself (the yellow square with "JS")

Save sourced images locally into an /assets or /images folder in the project
rather than hotlinking external URLs directly, so the page still works
offline during the live session (no dependency on internet during the actual
presentation — this is being presented live to a room of students, it cannot
break because of a flaky wifi connection).

Where a real photo/logo genuinely isn't available or appropriate, only then
fall back to a custom-drawn SVG/doodle in the site's own illustration style —
never fall back to a generic stock photo or a plain icon-font glyph standing
in for something that should be a real recognizable image.

## Autonomous Verification Work (do this yourself, don't just hand me code)
Do not treat this as done once the files are written. Actually run and
verify the site yourself, end to end, before handing it back:
1. Serve the HTML file locally and open it in a real browser via devtools.
2. For the Call Stack section: actually trigger the example function calls,
   pause execution (breakpoint or debugger statement), open the browser
   devtools Sources/Debugger panel, and take a real screenshot of the actual
   call stack panel showing the nested function calls. Include this real
   screenshot in the Call Stack section so students see what the call stack
   truly looks like in devtools, not just an abstract diagram. Do the same
   for Execution Context if devtools can meaningfully show scope/variables
   there (e.g. the Scope panel in devtools alongside a paused breakpoint).
2. Click through every "Run" button on every code snippet and confirm the
   output shown matches what real JS actually outputs — if a snippet is
   supposed to throw a ReferenceError or show `undefined`, verify it
   actually does that in the live output panel, don't assume it works.
3. Check the scroll-spy nav actually highlights the right section as you
   scroll through all 11 sections.
4. Resize the viewport and confirm the layout holds up on a laptop
   projector-sized screen (this will be presented on a projector to a
   classroom) and on mobile width too.
5. Fix anything broken before considering the task complete. Don't hand back
   a build that "should probably work" — confirm it actually does, visually,
   yourself.

## Quality Bar — Read This Carefully
This should not feel like a generic AI-generated template. It's being shown
to a room of junior college students during a live teaching session and
needs to actually hold their attention for over an hour of content — it is
competing with their phones. Concretely this means:
- Use real thought in the visual design — a distinct color identity per
  section, genuine micro-interactions (hover states, section transitions,
  small animations when a diagram "plays" like the call stack pushing/
  popping), not just a plain white page with text and a code box.
- If you have access to any modern UI/UX-focused tooling, design systems,
  or MCP-based design tools in this environment, use them to raise the
  visual quality bar rather than defaulting to basic unstyled HTML/CSS.
- Read this entire spec before starting, and don't skip the "boring" sections
  (History, Window Object) — they deserve the same visual effort as Event
  Loop, since a bored student checks out early and never gets to the good
  part.
- When in doubt about a design or content choice, pick the option a
  first-time learner in a live lecture would find clearer and more
  memorable, not the option that's fastest to build.

## Deliverable
A single deployable static site (can be one HTML file or a small set of
HTML/CSS/JS files) that can be opened directly in a browser or hosted
anywhere static (GitHub Pages, Netlify, etc.)
