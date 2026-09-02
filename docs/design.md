
# DESIGN.md

# Liquid Glass Design System — Apple-inspired Web Application

> **Purpose:** This document is the single source of truth for the visual design, interaction design, UX principles, component styling, layout system, motion, and visual quality standards of this web application.
>
> **Primary aesthetic direction:** Premium, calm, refined, spatial, translucent, tactile, and Apple-inspired Liquid Glass.
>
> **Important:** The design must feel like a **real, intentionally designed software product**, NOT an AI-generated dashboard, generic SaaS template, or "AI slop".

---

# 1. DESIGN NORTH STAR

The application should feel like:

* A premium native application brought to the web.
* Inspired by the visual language of modern Apple operating systems.
* Minimal but not empty.
* Sophisticated but not visually complicated.
* Translucent but still highly readable.
* Dynamic but not flashy.
* Functional first, aesthetic second.
* Designed by a human product designer rather than generated from a UI template.

The visual experience should communicate:

> **"Quietly premium."**

Avoid the impression of:

> "A generic AI dashboard with gradients, cards, icons, and glassmorphism."

---

# 2. CORE DESIGN PRINCIPLES

## 2.1 Content First

Glass is a visual material, NOT the primary design.

Do not turn every element into a glass card.

Use glass strategically for:

* Navigation
* Floating toolbars
* Dialogs
* Popovers
* Contextual controls
* Sticky controls
* Important elevated surfaces
* Selected states
* Floating panels

Do NOT automatically apply glass to:

* Every card
* Every table cell
* Every section
* Every button
* Every text block

The interface should still look excellent if the glass effect is temporarily disabled.

---

## 2.2 Depth Through Layers

Create hierarchy using:

1. Background
2. Content surface
3. Elevated surface
4. Floating glass
5. Modal / overlay

Each layer should have a different visual weight.

Do not make all surfaces equally translucent.

---

## 2.3 Controlled Transparency

Liquid Glass is not simply:

```css
background: rgba(255,255,255,.2);
backdrop-filter: blur(20px);
```

The implementation should combine:

* Transparency
* Background blur
* Saturation
* Subtle border
* Soft shadow
* Background interaction
* Light reflection
* Layer hierarchy

The result should feel like a physical translucent material.

---

# 3. VISUAL LANGUAGE

## 3.1 Overall Style

Use:

* Soft translucency
* Large visual breathing room
* Rounded geometry
* Subtle depth
* Natural shadows
* Fine borders
* Restrained gradients
* Smooth transitions
* Strong typography
* Clear hierarchy

Avoid:

* Excessive gradients
* Excessive glow
* Neon colors
* Huge text
* Excessive rounded cards
* Thick borders
* Strong drop shadows
* Decorative blobs
* Random floating shapes
* Excessive icons
* Excessive glass effects

---

# 4. COLOR SYSTEM

The application must support both light and dark appearance where technically appropriate.

## 4.1 Base Background

Do not use a flat white background everywhere.

Use a subtle layered background.

Example:

```css
--background:
  radial-gradient(
    circle at 20% 0%,
    rgba(255,255,255,0.8),
    transparent 35%
  ),
  linear-gradient(
    180deg,
    #f5f5f7 0%,
    #eeeeef 100%
  );
```

The actual implementation may adapt this to the application's brand.

The background should remain subtle.

---

# 5. LIQUID GLASS MATERIAL

Create a reusable material token.

Example:

```css
.glass {
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,0.58),
      rgba(255,255,255,0.28)
    );

  backdrop-filter:
    blur(28px)
    saturate(180%);

  -webkit-backdrop-filter:
    blur(28px)
    saturate(180%);

  border:
    1px solid rgba(255,255,255,0.42);

  box-shadow:
    0 8px 30px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.5);
}
```

However, do NOT blindly copy this implementation.

Adjust opacity, blur, border, and shadow according to the surrounding background.

---

# 6. GLASS HIERARCHY

Define multiple material levels.

## Glass 1 — Subtle

For:

* Navigation
* Secondary controls
* Background controls

Characteristics:

* Low opacity
* Low blur
* Minimal border
* Almost invisible shadow

---

## Glass 2 — Standard

For:

* Floating panels
* Toolbars
* Dropdowns
* Important controls

Characteristics:

* Medium transparency
* Medium blur
* Slight saturation
* Fine highlight border
* Soft shadow

---

## Glass 3 — Elevated

For:

* Modal dialogs
* Command palettes
* Important contextual surfaces

Characteristics:

* Higher opacity
* Stronger blur
* More pronounced depth
* Slight inner highlight
* Larger shadow

---

# 7. DO NOT OVERUSE GLASS

This is one of the most important rules.

BAD:

```text
Glass card
  Glass card
    Glass button
      Glass input
        Glass dropdown
```

GOOD:

```text
Background
 └── Main content surface
      ├── Normal content
      ├── Functional controls
      └── Floating glass toolbar
```

Glass should establish hierarchy rather than destroy it.

---

# 8. TYPOGRAPHY

Typography should feel Apple-like without blindly copying Apple's proprietary typography.

Preferred stack:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Inter",
  system-ui,
  sans-serif;
```

## Typography hierarchy

### Display

Used sparingly.

* Large
* Tight tracking
* Strong weight
* Short text

### Page Title

Should be visually dominant but not oversized.

Recommended:

```text
32–40px
font-weight: 600–700
letter-spacing: -0.025em
```

### Section Heading

```text
20–24px
font-weight: 600
```

### Body

```text
14–16px
font-weight: 400–500
line-height: 1.5–1.6
```

### Secondary Text

Use muted opacity rather than extremely light gray.

Never sacrifice readability for aesthetic minimalism.

---

# 9. SPACING SYSTEM

Use a consistent spacing scale.

Preferred base:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Avoid arbitrary values unless necessary.

The interface should have generous breathing room.

---

# 10. BORDER RADIUS

Use rounded geometry, but avoid making everything pill-shaped.

Recommended:

```text
Small controls:     10–12px
Inputs:              12–14px
Cards:               16–20px
Large panels:        20–28px
Modal:               24–32px
Pill controls:       9999px
```

Do not use `rounded-full` indiscriminately.

---

# 11. BUTTON DESIGN

Buttons should feel tactile and physical.

Primary button:

* Solid or semi-translucent
* Clear contrast
* Subtle highlight
* Smooth hover
* Small press animation

Secondary button:

* Glass or muted surface
* Minimal border

Ghost button:

* No visible container by default
* Surface appears on hover

Avoid:

* Huge buttons
* Excessive gradients
* Neon glow
* Excessive shadows
* Every button looking identical

Example interaction:

```text
Rest
 ↓
Hover
 ↓
Slight elevation / brightness
 ↓
Press
 ↓
Tiny scale reduction
 ↓
Return
```

Recommended press animation:

```css
transform: scale(0.97);
```

---

# 12. INPUT DESIGN

Inputs should feel integrated into the environment.

Default:

* Subtle translucent surface
* Thin border
* Clear text
* Comfortable padding

Focus:

* Strong but elegant focus ring
* Slight surface elevation
* No excessive glow

Never use:

```text
Bright blue border + huge blue glow
```

unless it is explicitly required by the application's brand/accessibility system.

---

# 13. NAVIGATION

Navigation should be lightweight.

Preferred approach:

* Floating or semi-floating navigation
* Glass material
* Strong spacing
* Clear active state
* Minimal iconography

Example conceptual structure:

```text
┌─────────────────────────────────────────────┐
│  Logo     Dashboard   Reports   Settings   ◯│
└─────────────────────────────────────────────┘
```

Navigation should NOT dominate the interface.

Avoid:

* Huge permanent sidebar
* Excessive menu groups
* 20+ navigation items
* Icons beside every single label when unnecessary

---

# 14. SIDEBAR

If the application requires a sidebar:

Use:

* Narrow width
* Clear grouping
* Strong active state
* Subtle glass material
* Comfortable vertical spacing

Do not make every navigation item look like a separate card.

Correct:

```text
Dashboard
────────────
Workspace

  Overview
  Reports
  Documents

────────────
Administration

  Users
  Settings
```

Incorrect:

```text
┌───────────────┐
│ Dashboard     │
└───────────────┘

┌───────────────┐
│ Reports       │
└───────────────┘

┌───────────────┐
│ Documents     │
└───────────────┘
```

---

# 15. CARDS

Cards must have a purpose.

Use cards when content needs:

* Grouping
* Separation
* Hierarchy
* Interaction
* Comparison

Do not wrap every piece of content inside a card.

Avoid the typical AI-generated dashboard pattern:

```text
┌─────────────┐
│ Icon        │
│             │
│ $24,582      │
│ Revenue      │
└─────────────┘

┌─────────────┐
│ Icon        │
│             │
│ 82%         │
│ Performance  │
└─────────────┘
```

unless the actual information architecture requires KPI cards.

Prefer contextual information layouts.

---

# 16. TABLES

Tables should prioritize readability over visual decoration.

Use:

* Clear column hierarchy
* Subtle row separators
* Comfortable row height
* Sticky headers where useful
* Hover states
* Inline actions when appropriate

Do NOT turn every table row into a glass card.

Use glass for:

* Table container
* Toolbar
* Filter controls

Keep the actual data dense and readable.

---

# 17. DASHBOARDS

Avoid generic "AI dashboard" design.

Do not automatically create:

* 4 KPI cards
* Giant gradient chart
* AI sparkle icon
* "Good morning, here's your overview"
* Random statistics
* Decorative blobs
* Multiple unnecessary cards

Instead:

1. Identify the user's primary task.
2. Put that task first.
3. Show supporting information second.
4. Put secondary actions in contextual locations.
5. Reduce visual noise.

The dashboard should answer:

> "What does the user need to know or do right now?"

---

# 18. ICONOGRAPHY

Use one coherent icon system.

Preferred characteristics:

* Simple
* Thin-to-medium stroke
* Consistent optical size
* Minimal detail

Do not mix:

* Filled icons
* Outline icons
* 3D icons
* Emoji
* Random SVG styles

Use icons to improve comprehension, not decoration.

Never place an icon beside every piece of text simply because space exists.

---

# 19. ICON + LABEL RULE

Icons should only be used when they communicate something meaningful.

BAD:

```text
🏠 Dashboard
📊 Reports
⚙ Settings
```

GOOD:

```text
Dashboard
Reports
Settings
```

with icons only when they improve recognition or scanning.

---

# 20. MOTION DESIGN

Motion should feel physical and intentional.

Use:

* Ease-out
* Spring-like transitions
* Small scale changes
* Blur transitions where appropriate
* Opacity transitions
* Transform transitions

Avoid:

* Excessive bouncing
* Long animations
* Dramatic page transitions
* Constant movement
* Decorative animation

Recommended duration:

```text
Micro interaction: 100–180ms
Normal transition: 180–280ms
Modal:              250–400ms
Complex transition: 350–500ms
```

---

# 21. MICRO-INTERACTIONS

The interface should respond to user actions.

Examples:

Button:

```text
hover → slightly brighter
press → scale(0.97)
release → smoothly return
```

Card:

```text
hover → subtle elevation
```

Navigation:

```text
active → soft background material
```

Modal:

```text
enter → fade + slight scale
exit → fade + slight scale
```

Keep animations subtle.

---

# 22. BACKGROUND DEPTH

Use background composition carefully.

Possible techniques:

* Very subtle radial gradients
* Ambient color fields
* Soft blurred shapes
* Light noise/grain
* Layered translucency

However:

**Background decoration must never compete with content.**

If users notice the background before the content, the background is too strong.

---

# 23. NO AI SLOP RULES

This section is mandatory.

The final interface must NOT look AI-generated.

## Never use the following by default:

### 1. Excessive gradients

Avoid:

```text
purple → blue → pink
```

on every section.

---

### 2. AI sparkle icons

Do not use:

```text
✨
✦
✧
```

as generic decoration or as an automatic indicator of "AI".

Only use them when the product actually contains an AI feature and the icon has semantic meaning.

---

### 3. Generic AI copy

Avoid:

```text
Welcome back!
Here's your personalized dashboard.

Supercharge your workflow.

Unlock powerful insights.

Your productivity is soaring!
```

unless the application genuinely requires such copy.

Use direct functional language.

Example:

```text
Pending Reviews
12 documents require review
```

---

### 4. Fake metrics

Never create decorative statistics just to make the dashboard look sophisticated.

Every metric must represent real application data.

---

### 5. Excessive rounded cards

Avoid turning the entire interface into:

```text
card
card
card
card
card
```

Hierarchy should come from layout and spacing as well as surfaces.

---

### 6. Excessive empty space

Minimalism does NOT mean wasting screen space.

Whitespace must improve comprehension.

---

### 7. Random gradients behind text

Do not place text over decorative gradients unless contrast is guaranteed.

---

### 8. Decorative blobs

Avoid generic:

```text
purple blob
blue blob
pink blob
```

in the background.

If ambient background shapes are used, they must be extremely subtle and serve the material illusion.

---

### 9. Excessive shadows

Avoid:

```css
box-shadow:
  0 20px 60px rgba(...);
```

on every component.

Use shadows primarily to communicate elevation.

---

### 10. Generic SaaS layout

Avoid automatically generating:

```text
Sidebar
+
Topbar
+
4 KPI cards
+
Chart
+
Recent Activity
+
Table
```

without first understanding the application's actual workflow.

---

# 24. HUMAN-CENTERED UX

Before designing a page, determine:

1. Who uses this page?
2. What is their primary task?
3. What information matters most?
4. What action should be easiest?
5. What information can be hidden?
6. What can be automated?
7. What can be removed?

The interface should minimize cognitive load.

---

# 25. MINIMUM CLICK PRINCIPLE

Optimize common workflows for the fewest reasonable interactions.

If an action can safely happen in:

```text
1 click
```

do not require:

```text
3 clicks
```

However, do NOT remove confirmation from destructive or irreversible actions merely to reduce clicks.

Use:

* Inline editing
* Contextual actions
* Smart defaults
* Keyboard shortcuts
* Search
* Command palette
* Bulk actions
* Progressive disclosure

where appropriate.

---

# 26. PROGRESSIVE DISCLOSURE

Do not expose every possible option immediately.

Show:

```text
Primary action
Secondary action
More
```

instead of:

```text
Action 1
Action 2
Action 3
Action 4
Action 5
Action 6
Action 7
Action 8
```

Advanced functionality can live behind contextual menus.

---

# 27. EMPTY STATES

Empty states should be useful.

Bad:

```text
Nothing here yet.
```

Better:

```text
No reports found.

Create a report to begin analyzing your data.

[ Create Report ]
```

Avoid decorative illustrations unless they meaningfully help the user.

---

# 28. LOADING STATES

Do not use generic spinning loaders everywhere.

Prefer:

* Skeletons
* Progressive rendering
* Optimistic UI where safe
* Contextual loading indicators

Loading should preserve layout stability.

---

# 29. ERROR STATES

Errors must explain:

1. What happened.
2. Why it happened, when known.
3. What the user can do next.

Example:

```text
Unable to upload the document.

The file exceeds the 25 MB limit.

[ Choose Another File ]
```

Avoid:

```text
Something went wrong.
```

without recovery guidance.

---

# 30. RESPONSIVE DESIGN

The design must work naturally across:

* Desktop
* Laptop
* Tablet
* Mobile

Do NOT simply shrink desktop UI.

On smaller screens:

* Reduce secondary information
* Collapse navigation
* Prioritize primary actions
* Convert tables into appropriate mobile representations
* Reduce visual density
* Preserve touch target sizes

---

# 31. ACCESSIBILITY

Liquid Glass must never compromise usability.

Minimum requirements:

* WCAG-conscious contrast
* Visible keyboard focus
* Minimum comfortable touch target
* Semantic HTML
* Proper labels
* Screen-reader-friendly structure
* Reduced-motion support
* No information conveyed by color alone

Provide:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

where appropriate.

---

# 32. PERFORMANCE

Glass effects can be expensive.

Do not apply heavy:

```css
backdrop-filter
```

to hundreds of elements.

Prefer glass on a small number of high-level surfaces.

Avoid unnecessary:

* Blur layers
* Filters
* Animated gradients
* Large shadows
* Continuous transforms

The UI must remain smooth.

A beautiful interface that performs poorly is considered a design failure.

---

# 33. COMPONENT CONSISTENCY

Every reusable component must follow the design system.

Create shared tokens for:

```text
Colors
Typography
Spacing
Radius
Shadow
Blur
Opacity
Motion
Elevation
```

Do not hard-code random values throughout the application.

---

# 34. DESIGN TOKENS

Create centralized tokens similar to:

```css
:root {
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  --blur-sm: 12px;
  --blur-md: 24px;
  --blur-lg: 36px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

Adapt tokens to the framework being used.

---

# 35. PAGE COMPOSITION

Every page should have an intentional visual hierarchy.

Recommended structure:

```text
Application Shell
│
├── Navigation
│
└── Main Content
    │
    ├── Page Header
    │   ├── Title
    │   ├── Context
    │   └── Primary Action
    │
    ├── Main Task
    │
    ├── Supporting Information
    │
    └── Secondary Information
```

Do not force every page into the same template.

---

# 36. VISUAL RHYTHM

Good interfaces have rhythm.

Use:

* Large spacing between major sections
* Medium spacing between related groups
* Small spacing between tightly related elements

Example:

```text
Page
  ↓ 48px

Section
  ↓ 24px

Group
  ↓ 12px

Related elements
```

---

# 37. MODALS

Modals should feel like floating physical surfaces.

Characteristics:

* Glass material
* Strong background blur
* Soft elevation
* Rounded corners
* Clear title
* Focused actions
* Escape key support

Do not use modals for workflows that could comfortably happen inline.

---

# 38. TOOLTIPS

Use tooltips only when the meaning is not obvious.

Do not explain obvious icons with tooltips everywhere.

Tooltips should be:

* Small
* Fast
* Clear
* Non-intrusive

---

# 39. NOTIFICATIONS / TOASTS

Toasts should appear as floating glass surfaces.

Use them for:

* Success
* Informational updates
* Non-blocking errors

Avoid excessive notifications.

If an action requires user attention, use a more appropriate UI pattern.

---

# 40. SEARCH AND COMMAND INTERFACE

For complex applications, consider a command palette.

Concept:

```text
⌘ K

Search or type a command...

────────────────────

Open Reports
Create Document
Search Users
Go to Settings
```

It should feel like a native productivity tool.

Do not implement a command palette merely because it looks sophisticated.

---

# 41. DATA DENSITY

The interface should adapt to the type of information.

For administrative or enterprise applications:

Prioritize:

* Readability
* Scannability
* Information density
* Clear status
* Fast actions

Do not sacrifice productivity for excessive minimalism.

---

# 42. STATUS SYSTEM

Status indicators should be immediately understandable.

Example:

```text
● Draft
● In Review
● Approved
● Rejected
```

Use:

* Text
* Icon
* Color

together when appropriate.

Do not rely solely on color.

---

# 43. DESIGN FOR REAL DATA

The UI must remain attractive when:

* Text is very long.
* Names are unusual.
* Numbers are large.
* Tables contain hundreds of rows.
* Data is missing.
* Status changes.
* User has no data.
* User has too much data.

Never design only for ideal placeholder content.

---

# 44. CONTENT LENGTH

Components must gracefully handle:

```text
Short text
Normal text
Long text
Extremely long text
```

Use:

* Wrapping
* Truncation
* Tooltips
* Expand/collapse

where appropriate.

Never allow long content to break the layout.

---

# 45. DARK MODE

Dark mode should not simply invert colors.

Use:

* Deep neutral background
* Subtle translucent surfaces
* Controlled highlights
* Reduced border intensity
* Reduced shadow dependence

Glass should feel like translucent material against a dark environment.

Avoid pure:

```text
#000000
```

for everything.

---

# 46. LIGHT MODE

Light mode should feel bright but not sterile.

Avoid:

```text
pure white everywhere
```

Use:

* Soft neutrals
* Subtle tonal variation
* Controlled translucency
* Natural depth

---

# 47. BRANDING

Brand colors should be treated as accents.

Do NOT turn the entire application into the brand color.

Use brand colors primarily for:

* Primary action
* Active states
* Important highlights
* Status where appropriate

The base interface should remain neutral.

---

# 48. DESIGN REVIEW CHECKLIST

Before considering a page complete, ask:

### Visual

* Does this feel premium?
* Is the hierarchy obvious?
* Is glass being overused?
* Are shadows subtle?
* Are borders subtle?
* Is typography balanced?
* Is the page visually calm?

### UX

* Is the primary action obvious?
* Can common tasks be completed with minimal clicks?
* Is unnecessary information hidden?
* Are actions placed where users expect them?
* Are errors recoverable?

### Anti-AI-Slop

* Does this look like a generic SaaS template?
* Are there unnecessary gradients?
* Are there unnecessary cards?
* Are there unnecessary icons?
* Is there fake data?
* Is there generic AI copy?
* Are there decorative blobs?
* Are there excessive rounded elements?
* Is there unnecessary glass everywhere?

If the answer to any of these is YES, simplify the interface.

---

# 49. AGENT IMPLEMENTATION INSTRUCTIONS

When implementing this design system, the coding agent MUST:

1. Read this `DESIGN.md` before modifying UI code.
2. Treat this file as the primary visual design authority.
3. Inspect the existing application's information architecture before redesigning it.
4. Preserve existing functionality unless explicitly instructed otherwise.
5. Never redesign functionality merely to make the interface look better.
6. Reuse existing components where possible.
7. Create reusable design tokens.
8. Create reusable glass materials.
9. Avoid duplicating CSS.
10. Avoid arbitrary styling values.
11. Maintain responsive behavior.
12. Maintain accessibility.
13. Maintain performance.
14. Test loading, empty, error, and populated states.
15. Test long content.
16. Test mobile layouts.
17. Test keyboard navigation.
18. Respect `prefers-reduced-motion`.

---

# 50. CRITICAL ANTI-AI-SLOP DIRECTIVE

The agent must NOT interpret this document as permission to generate a stereotypical "AI-designed" interface.

Do NOT blindly apply:

```text
gradient + glass + rounded card + icon + shadow
```

to every component.

Instead, the agent must make deliberate design decisions.

Every visual element must answer:

> **"What purpose does this serve?"**

If the answer is:

> "It looks cool."

Remove it.

The goal is not to make the application look "AI futuristic."

The goal is to make it look:

* intentional
* mature
* calm
* premium
* functional
* trustworthy
* human-designed

---

# 51. FINAL QUALITY BAR

The finished application should feel closer to:

```text
Native Apple application
        +
Modern professional web application
        +
Enterprise-grade usability
```

and NOT:

```text
Generic SaaS template
        +
AI-generated dashboard
        +
Glassmorphism everywhere
```

The visual language should be subtle enough that a user might describe it simply as:

> "This app feels really polished."

rather than:

> "This app uses a lot of glass effects."

That distinction is critical.

---

# 52. FINAL AGENT PROMPT

When implementing or redesigning any interface, follow this sequence:

```text
1. Understand the user's workflow.
2. Identify the primary task.
3. Identify the information hierarchy.
4. Simplify the interface.
5. Establish layout and spacing.
6. Establish typography.
7. Establish neutral base surfaces.
8. Introduce Liquid Glass selectively.
9. Add interaction states.
10. Add motion.
11. Validate accessibility.
12. Validate responsive behavior.
13. Validate performance.
14. Review against the Anti-AI-Slop rules.
15. Remove anything decorative that does not improve usability.
```

The final result must prioritize:

```text
UX
↓
Information hierarchy
↓
Usability
↓
Visual hierarchy
↓
Material design
↓
Motion
↓
Decoration
```

Never reverse this priority.

---

# END OF DESIGN SYSTEM
