// ===== 26-modal-chrome.js (NEW in 6.2.0, Stage 6b) =====
// Expands data-attributes in index.html into the shared modal chrome
// classes that used to be repeated literally on every modal. Runs at
// module evaluation (main.js imports this before 99-init; type="module"
// scripts execute after the DOM is parsed, so every modal exists here,
// and no modal can be SHOWN before this runs because all show/hide
// wiring happens in 99-init and later).
//
// DESIGN (see HANDOFF.md §7, Stage 6b):
// - CLASS ADDITION ONLY. This module never creates, moves, clones, or
//   removes elements, so the ~370 getElementById references captured by
//   02-dom-elements.js — and every event listener — stay valid no matter
//   when they were taken.
// - The markup contract in index.html:
//     data-modal                 backdrop wrapper. Default: items-center,
//                                z-50. Variants: data-modal-align="start"
//                                (scrolling settings modal), data-modal-z
//                                with the LITERAL z class (e.g. "z-[60]"),
//                                or "none" to add no z class at all (the
//                                custom-text visual modal keeps its inline
//                                style="z-index: 90"). Any extra classes
//                                (p-4, overflow-y-auto, hidden) remain in
//                                class="" untouched.
//     data-modal-panel           the white card. Extra classes (max-w-*,
//                                max-h-[90vh], overflow-y-auto) remain in
//                                class="". Three legacy panels don't use
//                                this and keep fully bespoke markup.
//     data-btn="cancel|primary|danger"   the three standard buttons.
//                                Buttons with any deviation (text-sm,
//                                disabled:opacity-50, hidden, w-full)
//                                were deliberately NOT converted.
// - These strings are ALSO the Tailwind content-scanner's source for the
//   chrome classes (build/tailwind.config.js scans src/js/**), which is
//   why they are kept as plain space-separated literals: the 6.2.0
//   tailwind.css rebuild came out byte-identical, proving no class was
//   lost in the move. Do not "clean up" these strings into computed
//   values — the scanner cannot see through concatenation.
// - z-[60] and z-[100] arbitrary-value classes are picked up by the
//   scanner from the data-modal-z attributes in index.html itself.
//   NOTE (pre-existing, preserved on purpose): the bare z-60 / z-70
//   classes on three modals generate NO CSS in stock Tailwind — those
//   modals stack by DOM order today, exactly as they did before 6.2.0.
//   Fixing that is a behavior change; if desired, do it as its own pass.
// - Schoolification hook: restyling every modal is now a one-place edit.

const BACKDROP_BASE = 'fixed inset-0 bg-black bg-opacity-60 flex justify-center';
const PANEL_BASE = 'bg-white p-8 rounded-lg shadow-xl w-full';
const BUTTON_KINDS = {
    cancel: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300',
    primary: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
    danger: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700',
};

function addAll(el, classString) {
    el.classList.add(...classString.split(' '));
}

for (const el of document.querySelectorAll('[data-modal]')) {
    addAll(el, BACKDROP_BASE);
    el.classList.add(el.dataset.modalAlign === 'start' ? 'items-start' : 'items-center');
    const z = el.dataset.modalZ;
    if (z !== 'none') el.classList.add(z || 'z-50');
}

for (const el of document.querySelectorAll('[data-modal-panel]')) {
    addAll(el, PANEL_BASE);
}

for (const el of document.querySelectorAll('[data-btn]')) {
    const classes = BUTTON_KINDS[el.dataset.btn];
    if (classes) addAll(el, classes);
}
