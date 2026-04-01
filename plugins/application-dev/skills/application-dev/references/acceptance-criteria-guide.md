# Writing Testable Acceptance Criteria

## What makes criteria testable

Each criterion describes one observable outcome from the user's perspective. Write
one assertion per bullet -- if a bullet contains "and", split it into two. Include
measurable thresholds when the spec naturally supplies numbers (e.g., "at least 12
items"). Do not force synthetic thresholds on behaviors that are binary by nature
(e.g., "user can create an artwork" needs no number).

## Good vs bad examples

**Display counts**
- Bad: "The gallery shows artworks" -- no threshold, any count passes.
- Good: "Gallery displays at least 12 artworks on initial load" -- the spec defines 12, so the criterion uses it.

**User actions**
- Bad: "Clicking the Add button opens a modal form" -- prescribes UI elements (button, modal, form).
- Good: "User can create a new artwork with title, artist, and image" -- describes the outcome, not the UI path.

**Error states**
- Bad: "Form validation works correctly" -- "correctly" is not observable.
- Good: "Submitting with an empty title shows validation feedback" -- names the trigger and the observable result.

**Persistence**
- Bad: "Data is stored in localStorage" -- exposes the storage mechanism.
- Good: "Created artwork persists after page refresh" -- user-facing behavior only.

**Responsive behavior**
- Bad: "Works well on mobile" -- "well" is not measurable.
- Good: "Gallery adapts to single-column layout at 320px viewport width" -- names the breakpoint and the expected change.

## Tier rules

**Core features** require at least 3 criteria covering these three types:
1. Happy path -- the main success scenario (e.g., "Gallery displays at least 12 artworks").
2. Edge case -- a boundary or unusual input (e.g., "Filtering with no matches shows an empty-state message").
3. Error state -- invalid input or failure condition (e.g., "Submitting with an empty title shows validation feedback").

**Important features** require at least 2 criteria. Types are flexible -- choose the
two most meaningful for the feature.

**Nice-to-have features** require at least 1 criterion.

## Common pitfalls

**Vague qualities.** Words like "good", "intuitive", "professional", or "clean" cannot
be verified by automated tests. Replace them with observable thresholds or behaviors.

**UI-prescriptive language.** Naming specific UI elements (modal, sidebar, dropdown, tab)
constrains the builder's design choices. Describe what the user accomplishes, not which
widget they interact with.

**Implementation details.** Mentioning technologies, storage mechanisms, API endpoints, or
internal data structures leaks implementation into the spec. Criteria describe what the
user sees, not how the system works internally.

**Cross-feature criteria.** A criterion like "creating an artwork makes it appear in the
gallery and in search results" spans two features. Test each feature independently.

## AI feature criteria

AI outputs are variable by nature -- the same prompt produces different results each time.
Test behavioral quality rather than exact content.

- Bad: "AI generates a description containing the word 'masterpiece'" -- exact content is unpredictable.
- Good: "AI-generated description appears within 5 seconds and contains at least 20 words" -- tests responsiveness and non-trivial output.

- Bad: "AI suggestions are relevant and helpful" -- subjective and unmeasurable.
- Good: "AI suggests at least 3 tag options when the user requests tag suggestions" -- tests that suggestions appear in the expected quantity.
