// ===== 33-roster.js (NEW in 6.9.0 — DESIGN-CALENDAR-V2.md Layer 3) =====
// Roster & Tags: one doc per user at public/data/roster/{uid} —
// { displayName, tags: [...], capabilities: [...] }.
//
// THE LAYER 3 INVARIANT (owner decision, carved into the rules file too):
// tags are PICKER FILTERS, never runtime targeting. Future designation UIs
// (Layer 4) use tags to narrow a list, the admin EYEBALLS the list, and the
// EXPLICIT checked uid list is what gets stored. No runtime tag resolution,
// no priority rules. CDC (all three grades, one room) therefore needs no
// special-casing, and the aspirational related-arts teacher gets caught by
// eyeball. Nothing in this module — or anywhere — may resolve tags at ring
// time.
//
// Two surfaces:
// - SELF-SERVE ("My Tags", header button): a user edits their OWN tags.
//   Capabilities are shown read-only ("granted by admins"). The rules
//   enforce that self-writes cannot touch the capabilities field (the
//   write sends the full doc minus capabilities via merge; rules compare
//   post-write state).
// - ADMIN ("Roster & Tags", Admin Zone): edit anyone's tags AND
//   capabilities (e.g. 'may-break-anchors', granted narrowly), remove
//   users, and "Seed from presence" to bootstrap rows for everyone the
//   usage dashboard has ever seen (presence read is admin-only; this
//   module's admin surface only functions for admins — rules are the
//   boundary, buttons are furniture).
//
// Module pattern: 29/30 self-contained; lazy reads; suggested-tag chips
// for one-click adding (6th/7th/8th, subjects, CDC, Office).

import { escapeHtml } from './00-header.js';
import {
    collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc,
} from './01-firebase-imports.js';
import { safeLog } from './03-memory-management.js';
import { state } from './state.js';

const SUGGESTED_TAGS = ['6th', '7th', '8th', 'Math', 'ELA', 'Science',
    'Social Studies', 'Related Arts', 'CDC', 'Office'];

// --- DOM ---
const myTagsBtn = document.getElementById('my-tags-btn');
const myModal = document.getElementById('my-tags-modal');
const myClose = document.getElementById('my-tags-close');
const myList = document.getElementById('my-tags-list');
const mySuggest = document.getElementById('my-tags-suggest');
const myInput = document.getElementById('my-tags-input');
const myAddBtn = document.getElementById('my-tags-add');
const myCaps = document.getElementById('my-tags-caps');
const myStatus = document.getElementById('my-tags-status');
const rosterOpenBtn = document.getElementById('roster-open-btn');
const rosterModal = document.getElementById('roster-modal');
const rosterClose = document.getElementById('roster-close');
const rosterList = document.getElementById('roster-list');
const rosterSeedBtn = document.getElementById('roster-seed-btn');
const rosterStatus = document.getElementById('roster-status');

let myDoc = null;          // my roster doc data (or null)
let rosterUnsub = null;    // admin modal snapshot
let rosterRows = [];       // [{uid, data}]

function rosterRef(uid) {
    return doc(state.db, 'artifacts', state.appId, 'public', 'data', 'roster', uid);
}
function chip(label, removeAttr, extraClass) {
    return '<span class="px-2 py-1 rounded-lg text-xs font-medium ' + extraClass + '">'
        + escapeHtml(label)
        + (removeAttr ? ' <button type="button" ' + removeAttr
            + ' class="font-bold hover:text-red-600">&times;</button>' : '')
        + '</span>';
}
function setStatus(el, msg, isError) {
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
    el.classList.toggle('text-red-600', !!isError);
    el.classList.toggle('text-blue-600', !isError);
}
function cleanTag(raw) {
    return (raw || '').trim().replace(/\s+/g, ' ').slice(0, 40);
}

// ---------- SELF-SERVE ----------

async function openMyTags() {
    myModal.classList.remove('hidden');
    setStatus(myStatus, '');
    if (!state.userId || !state.db) {
        myList.innerHTML = '';
        mySuggest.innerHTML = '';
        myCaps.innerHTML = '';
        setStatus(myStatus, 'Sign in first to set your tags.', true);
        return;
    }
    myList.innerHTML = '<p class="text-sm text-gray-500">Loading…</p>';
    try {
        const snap = await getDoc(rosterRef(state.userId));
        myDoc = snap.exists() ? snap.data() : { tags: [] };
    } catch (e) {
        setStatus(myStatus, 'Error loading: ' + (e && e.message), true);
        myDoc = { tags: [] };
    }
    renderMyTags();
}

function renderMyTags() {
    const tags = (myDoc && myDoc.tags) || [];
    myList.innerHTML = tags.length
        ? tags.map((t) => chip(t, 'data-my-remove="' + escapeHtml(t) + '"',
            'bg-gray-200 text-gray-700')).join(' ')
        : '<p class="text-sm text-gray-500">No tags yet — pick from the suggestions or type your own.</p>';
    mySuggest.innerHTML = SUGGESTED_TAGS.filter((t) => !tags.includes(t))
        .map((t) => '<button type="button" data-my-suggest="' + escapeHtml(t)
            + '" class="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-300">'
            + escapeHtml(t) + '</button>').join(' ');
    const caps = (myDoc && myDoc.capabilities) || [];
    myCaps.innerHTML = caps.length
        ? caps.map((c) => chip(c, null, 'bg-amber-100 text-amber-900')).join(' ')
        : '<p class="text-xs text-gray-500">None. Capabilities are granted by admins.</p>';
}

async function saveMyTags(nextTags) {
    try {
        // NEVER include capabilities in a self-write — rules enforce it,
        // this just makes the honest path the only path.
        await setDoc(rosterRef(state.userId), {
            displayName: state.currentUserDisplayName || 'Anonymous',
            tags: nextTags,
        }, { merge: true });
        myDoc = { ...(myDoc || {}), tags: nextTags };
        renderMyTags();
        setStatus(myStatus, 'Saved.');
    } catch (e) {
        setStatus(myStatus, 'Error saving: ' + (e && e.message), true);
    }
}

function myAdd(raw) {
    const t = cleanTag(raw);
    if (!t) return;
    const tags = ((myDoc && myDoc.tags) || []).slice();
    if (!tags.includes(t)) tags.push(t);
    myInput.value = '';
    saveMyTags(tags);
}

// ---------- ADMIN ROSTER ----------

function openRoster() {
    rosterModal.classList.remove('hidden');
    setStatus(rosterStatus, '');
    rosterList.innerHTML = '<p class="text-sm text-gray-500">Loading…</p>';
    const col = collection(state.db, 'artifacts', state.appId, 'public', 'data', 'roster');
    rosterUnsub = onSnapshot(col, (snap) => {
        rosterRows = snap.docs.map((d) => ({ uid: d.id, data: d.data() }))
            .sort((a, b) => (a.data.displayName || '').localeCompare(b.data.displayName || ''));
        renderRoster();
    }, (err) => {
        setStatus(rosterStatus, 'Error: ' + err.message + ' (admin only)', true);
    });
}

function closeRoster() {
    rosterModal.classList.add('hidden');
    if (rosterUnsub) { rosterUnsub(); rosterUnsub = null; }
}

function renderRoster() {
    if (!rosterRows.length) {
        rosterList.innerHTML = '<p class="text-sm text-gray-500 mb-4">No roster entries yet. "Seed from presence" creates a row for everyone the usage dashboard has seen, or users add themselves via My Tags.</p>';
        return;
    }
    rosterList.innerHTML = rosterRows.map(({ uid, data }) => {
        const tags = (data.tags || []).map((t) =>
            chip(t, 'data-r-tag-del="' + escapeHtml(t) + '" data-r-uid="' + uid + '"',
                'bg-gray-200 text-gray-700')).join(' ');
        const caps = (data.capabilities || []).map((c) =>
            chip(c, 'data-r-cap-del="' + escapeHtml(c) + '" data-r-uid="' + uid + '"',
                'bg-amber-100 text-amber-900')).join(' ');
        return '<div class="border-b py-3">'
            + '<div class="flex items-center justify-between gap-3 mb-2">'
            + '<span class="font-medium text-sm">' + escapeHtml(data.displayName || uid) + '</span>'
            + '<button type="button" data-r-del="' + uid + '" class="text-red-600 text-xs hover:underline">Remove</button>'
            + '</div>'
            + '<div class="mb-2">' + (tags || '<span class="text-xs text-gray-500">no tags</span>') + '</div>'
            + '<div class="mb-2">' + (caps || '<span class="text-xs text-gray-500">no capabilities</span>') + '</div>'
            + '<div class="flex flex-col sm:flex-row gap-3">'
            + '<input type="text" data-r-tag-input="' + uid + '" placeholder="Add tag" class="flex-grow px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm">'
            + '<input type="text" data-r-cap-input="' + uid + '" placeholder="Grant capability (narrowly!)" class="flex-grow px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm">'
            + '</div></div>';
    }).join('');
}

async function adminWrite(uid, patch, label) {
    try {
        await setDoc(rosterRef(uid), patch, { merge: true });
        setStatus(rosterStatus, label);
    } catch (e) {
        setStatus(rosterStatus, 'Error: ' + (e && e.message), true);
    }
}

function rowData(uid) {
    const row = rosterRows.find((r) => r.uid === uid);
    return row ? row.data : { tags: [], capabilities: [] };
}

async function seedFromPresence() {
    rosterSeedBtn.disabled = true;
    setStatus(rosterStatus, 'Reading presence…');
    try {
        const col = collection(state.db, 'artifacts', state.appId, 'public', 'data', 'presence');
        const snap = await getDocs(col);
        const have = new Set(rosterRows.map((r) => r.uid));
        let added = 0;
        for (const d of snap.docs) {
            if (have.has(d.id)) continue;
            const p = d.data();
            if (p.surface === 'clock') continue; // TVs are not staff
            await setDoc(rosterRef(d.id), {
                displayName: p.displayName || 'Unknown',
                tags: [],
            }, { merge: true });
            added++;
        }
        setStatus(rosterStatus, added
            ? 'Added ' + added + ' user(s) from presence.'
            : 'Everyone in presence is already on the roster.');
        safeLog.log('Roster seed: added', added, 'from presence.');
    } catch (e) {
        setStatus(rosterStatus, 'Error seeding: ' + (e && e.message), true);
    } finally {
        rosterSeedBtn.disabled = false;
    }
}

// ---------- wiring ----------

if (myTagsBtn) myTagsBtn.addEventListener('click', openMyTags);
if (myClose) myClose.addEventListener('click', () => myModal.classList.add('hidden'));
if (myAddBtn) myAddBtn.addEventListener('click', () => myAdd(myInput.value));
if (myInput) myInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') myAdd(myInput.value); });
if (myModal) myModal.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.myRemove) {
        saveMyTags(((myDoc && myDoc.tags) || []).filter((x) => x !== t.dataset.myRemove));
    } else if (t.dataset.mySuggest) {
        myAdd(t.dataset.mySuggest);
    }
});

if (rosterOpenBtn) rosterOpenBtn.addEventListener('click', openRoster);
if (rosterClose) rosterClose.addEventListener('click', closeRoster);
if (rosterSeedBtn) rosterSeedBtn.addEventListener('click', seedFromPresence);
if (rosterList) {
    rosterList.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        const uid = t.dataset.rUid;
        if (t.dataset.rTagDel && uid) {
            adminWrite(uid, { tags: (rowData(uid).tags || []).filter((x) => x !== t.dataset.rTagDel) }, 'Tag removed.');
        } else if (t.dataset.rCapDel && uid) {
            adminWrite(uid, { capabilities: (rowData(uid).capabilities || []).filter((x) => x !== t.dataset.rCapDel) }, 'Capability revoked.');
        } else if (t.dataset.rDel) {
            if (window.confirm('Remove this user from the roster? (Their tags and capabilities are deleted; they can re-add themselves via My Tags.)')) {
                deleteDoc(rosterRef(t.dataset.rDel)).catch((err) => setStatus(rosterStatus, 'Error: ' + err.message, true));
            }
        }
    });
    rosterList.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (t.dataset.rTagInput) {
            const uid = t.dataset.rTagInput;
            const tag = cleanTag(t.value);
            if (!tag) return;
            const tags = (rowData(uid).tags || []).slice();
            if (!tags.includes(tag)) tags.push(tag);
            t.value = '';
            adminWrite(uid, { tags }, 'Tag added.');
        } else if (t.dataset.rCapInput) {
            const uid = t.dataset.rCapInput;
            const cap = cleanTag(t.value);
            if (!cap) return;
            const caps = (rowData(uid).capabilities || []).slice();
            if (!caps.includes(cap)) caps.push(cap);
            t.value = '';
            adminWrite(uid, { capabilities: caps }, 'Capability granted.');
        }
    });
}

// ===== module exports (6.9.0) =====
// (none — self-wiring side-effect module, 28/29 pattern)
export {};
