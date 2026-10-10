# New Design — Analysis

Reference: 3-screen mobile mock (Home, Task Schedule, Add New Task). Light lavender/peach glass look, violet accent, lime highlight, black for selected states.

## 1. Global

| Token | Value (approx.) | Usage |
|---|---|---|
| Background | Soft gradient: pink/peach top-left → lilac top-right → pale lavender bottom | Every screen |
| Surface | `#FFFFFF`, fully opaque | Cards, inputs, round buttons, nav bar |
| Glass | White 40–60% + blur, 1–2px white border, faint diagonal light streaks | Today's Progress card |
| Primary | Violet gradient `#8B6CFF → #6A47EE` | + button, active nav tab, Create Task, progress disc |
| Lime | `#D5E08A` | Selected status pill, progress knob |
| Ink | `#17161D` | Text, selected day, "All" chip |
| Muted text | `#8E89A0` | Subtitles, placeholders, small labels |
| Font | Geometric sans (Plus Jakarta Sans / similar), weights 400 and 600 | — |

- **Typography scale:** The scale is small and phone-native. Page headlines are about 26–28px, split across two lines: the first line light (400) and the second semibold. Examples: "Let's Make" / **"Today Productive"** and "Task" / **"Schedule"**. Section titles ("Today's Tasks", "Morning") are 16–18px semibold, body text is 13–14px, and micro labels are 10–11px.
- **Shape language:** Everything is round. Buttons are full circles of about 44px. Pills are fully rounded. Cards have a 20–24px radius.
- **Shadows:** Very soft and diffuse, with almost no visible edge.

## 2. Bottom navigation (all screens)

- The nav is a floating white rounded rectangle (about 24px radius), inset about 12px from the sides and bottom.
- It has 4 items: **Home, Projects, Calendar, Profile**.
- Every item shows its icon **stacked above** a small label of about 11px.
- The active item sits on a violet gradient rounded-square pill (about 64×64) with a white icon and label. Inactive items have ink-colored icons and labels.

## 3. Home

1. **Header row**
   - Left: a round avatar (about 44px).
   - Next to it, two lines: "Good Morning" (15px, ink) above the name (12px, muted).
   - Right: a violet + circle and a white bell circle, both about 44px.
2. **Headline:** "Let's Make" (light) / "**Today Productive**" (semibold), about 26px.
3. **Today's Progress glass card**
   - Title "Today's Progress" in 13px semibold.
   - Left: the progress widget (the "loader").
     - A thick white ring (about 10px) wraps a **filled violet gradient disc**.
     - "72%" sits in the disc in white, with a small "%".
     - A small lime knob sits on the ring.
   - A thin vertical divider separates the ring from the stats.
   - Right: three stat rows, each with:
     - A small lavender rounded-square icon tile.
     - The number (13px, semibold).
     - A label below it in micro text: Total Task, Completed Task, Pending Task.
4. **Today's Tasks**
   - The title row has "View All" on the right in small ink text.
5. **Status pills**
   - The row scrolls horizontally.
   - Each pill is about 44px tall and contains a 32px white count circle followed by a label.
   - The selected pill is lime filled with a white count circle. Unselected pills are white with a light-grey count circle.
   - Options: To Do, In Progress, In Review.
6. **Task card** (white, about 22px radius)
   - Top-left: a small outlined badge reading "● High Priority" (10px, red dot).
   - Top-right: a grey ↗ circle of about 36px.
   - Title: about 16px semibold.
   - Bottom-left: a clock icon and "10:30 AM – 11:30 AM" in 12px.
   - Bottom-right: an overlapping avatar stack with a "+4" black circle. Per an earlier decision this is replaced by a done toggle.

## 4. Task Schedule (Calendar)

1. **Top bar**
   - Left: a white ← circle, then "Wed, April 26" (14px).
   - Right: a violet + circle and a white ••• circle.
2. **Title and Calendar button**
   - Headline "Task" (light) / "**Schedule**" (semibold).
   - Right: a white pill button reading "Calendar", with a calendar icon in a light inner circle.
3. **Week strip** (Mon–Sat visible)
   - Each day is a tall white capsule (about 44×76) with the weekday name on top and the date number in an inner circle.
   - The selected day's inner circle is black with a white number.
4. **Filter chips**
   - The chips are "All", "Work" with a briefcase icon, "Personal" with a person icon, and a ★ chip that is cut off at the right edge.
   - Selected: black with white text. Unselected: white.
5. **Section header:** a ☀ icon with "Morning" on the left and "Today" in muted text on the right.
6. **Timeline card** (white, about 22px radius; the time is **inside** the card)
   - Left column: "9:00" (16px) with "AM" (10px) below it, then a thin vertical line ending in a small arrow tick.
   - Right column:
     - Title (14px semibold).
     - Description (11px muted, up to 3 lines) **or** a clock time range.
     - A bottom row with the avatar stack on the left and an action pill on the right.
   - The action pill is either "Meet", solid blue with a video icon, or "In Progress", tinted violet with a violet border and a clock icon.
   - Our version replaces those with a status or priority pill.

## 5. Add New Task

1. **Top bar:** a white × circle, then "Add New Task" (15px), then a white ✓ circle.
2. **Fields:** each has a 13px label above a white rounded input (about 48px tall; description about 80px, 20px radius).
   - Task Title: placeholder "Finish landing page design".
   - Description: multi-line.
3. **Due Date & time:** two equal white pills side by side, with a calendar icon and "April 14, 2026" in one and a clock icon and "10:00 AM" in the other.
4. **Priority:** three equal outlined pills.
   - Low: green border and text on a light green fill.
   - Medium: orange border and text on a light orange fill.
   - High: red border and text on a light pink fill.
5. **Project:** a white select with a violet folder icon, the value "Website Redesign" and a chevron on the right.
6. **Tags**
   - Each tag is an outlined violet chip (light violet fill, violet text and border) with an ×.
   - "+ Add" is a grey outlined chip.
7. **Primary button:** a full-width violet gradient "Create Task" pill (about 52px) with a soft violet glow underneath.

## 6. Differences vs. current implementation (to fix)

- **Global type scale:** headlines and sizes are currently too large. Shrink them to the scale above, and use a light first line with a semibold second line.
- **Nav:** inactive items need labels, the icon goes above the label, and the active tab should be a rounded square rather than a wide pill.
- **Progress widget:** the current widget is a thin dark ring with a lime knob. The reference uses a thick white ring around a filled violet disc. Confirmed: copy the reference.
- **Stats:** use square icon tiles with smaller text, and add a vertical divider.
- **Status pills and task card:** make them smaller and lighter, and use a smaller priority badge.
- **Schedule cards:** move the time inside the card and add the arrow line.
- **Week days:** the date number goes in an inner circle, and only that circle is black when selected.
- **Filter chips:** Work and Personal get icons.
- **Back button:** use ← instead of ‹.
- **Add Task:** labels are smaller. Priority pills should be outlined and tinted, tags should be violet outlined chips, and the Create button needs a glow.
