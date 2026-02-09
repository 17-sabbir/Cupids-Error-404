
let lastZoneIndex = -1;
let lastAbsPos = null;
let topAppearStreak = 0;

function moveNoButton() {
    const noButton = document.querySelector('.no-button');
    const container = document.querySelector('.container');
    const gifContainer = document.querySelector('.gif_container');
    const buttonsWrap = document.querySelector('.buttons');
    const yesButton = document.querySelector('.yes-button');
    if (!noButton || !container || !gifContainer || !buttonsWrap) return;

    noButton.classList.add('is-evasive');

    const containerRect = container.getBoundingClientRect();
    const gifRect = gifContainer.getBoundingClientRect();
    const buttonsRect = buttonsWrap.getBoundingClientRect();

    const btnRect = noButton.getBoundingClientRect();
    const btnW = btnRect.width || 120;
    const btnH = btnRect.height || 48;

    const margin = 5;
    const yesRect = yesButton ? yesButton.getBoundingClientRect() : null;
    const yesPadding = 10;
    const minMoveDistance = 40;

    function isTooCloseToLast(absLeft, absTop) {
        if (!lastAbsPos) return false;
        const dx = absLeft - lastAbsPos.left;
        const dy = absTop - lastAbsPos.top;
        return (dx * dx + dy * dy) < (minMoveDistance * minMoveDistance);
    }

    function overlapsYes(absLeft, absTop) {
        if (!yesRect) return false;

        const aLeft = absLeft;
        const aTop = absTop;
        const aRight = absLeft + btnW;
        const aBottom = absTop + btnH;

        const bLeft = yesRect.left - yesPadding;
        const bTop = yesRect.top - yesPadding;
        const bRight = yesRect.right + yesPadding;
        const bBottom = yesRect.bottom + yesPadding;

        return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
    }

    // Allowed zones: photo area + buttons area (so it won't cover the heading).
    const zonesAbs = [gifRect, buttonsRect];

    // Pattern: show on top 3 times, then bottom 1 time.
    // Here, zone 0 = top (photo), zone 1 = bottom (buttons).
    const preferredZoneOrder = () => {
        if (zonesAbs.length < 2) return [0];
        return topAppearStreak >= 3 ? [1, 0] : [0, 1];
    };

    const tryPlaceInZone = (zoneIndex, attempts) => {
        const zone = zonesAbs[zoneIndex];
        const zoneLeftInContainer = zone.left - containerRect.left;
        const zoneTopInContainer = zone.top - containerRect.top;
        const zoneWidth = zone.width;
        const zoneHeight = zone.height;

        const usableW = Math.max(0, zoneWidth - btnW - margin * 2);
        const usableH = Math.max(0, zoneHeight - btnH - margin * 2);

        for (let i = 0; i < attempts; i++) {
            let left = zoneLeftInContainer + margin + Math.random() * usableW;
            let top = zoneTopInContainer + margin + Math.random() * usableH;

            const maxLeft = Math.max(margin, containerRect.width - btnW - margin);
            const maxTop = Math.max(margin, containerRect.height - btnH - margin);
            left = Math.min(Math.max(margin, left), maxLeft);
            top = Math.min(Math.max(margin, top), maxTop);

            const absLeft = containerRect.left + left;
            const absTop = containerRect.top + top;
            if (!overlapsYes(absLeft, absTop) && !isTooCloseToLast(absLeft, absTop)) {
                lastZoneIndex = zoneIndex;
                noButton.style.left = `${Math.round(left)}px`;
                noButton.style.top = `${Math.round(top)}px`;
                lastAbsPos = { left: absLeft, top: absTop };

                if (zoneIndex === 0) {
                    topAppearStreak += 1;
                } else {
                    topAppearStreak = 0;
                }

                return true;
            }
        }

        return false;
    };

    // First try the preferred zone (top 3x, bottom 1x), then fallback to the other.
    const order = preferredZoneOrder();
    for (const zoneIndex of order) {
        if (tryPlaceInZone(zoneIndex, 12)) return;
    }

    // If the preferred ordering failed, try anywhere.
    for (let zoneIndex = 0; zoneIndex < zonesAbs.length; zoneIndex++) {
        if (tryPlaceInZone(zoneIndex, 12)) return;
    }

    // Fallback: place it safely in the photo zone (top-left inside the photo area).
    const safeZone = gifRect;
    const safeLeft = Math.min(
        Math.max(margin, safeZone.left - containerRect.left + margin),
        Math.max(margin, containerRect.width - btnW - margin)
    );
    const safeTop = Math.min(
        Math.max(margin, safeZone.top - containerRect.top + margin),
        Math.max(margin, containerRect.height - btnH - margin)
    );
    noButton.style.left = `${Math.round(safeLeft)}px`;
    noButton.style.top = `${Math.round(safeTop)}px`;
    lastAbsPos = { left: containerRect.left + safeLeft, top: containerRect.top + safeTop };
    topAppearStreak = 0;
}

document.addEventListener('DOMContentLoaded', () => {
    const noButton = document.querySelector('.no-button');
    if (!noButton) return;

    // Ensure it starts normally next to "Yes" (in case HTML had inline styles).
    noButton.classList.remove('is-evasive');
    noButton.style.left = '';
    noButton.style.top = '';

    // Make it effectively non-clickable everywhere (mouse, touch, keyboard),
    // but keep it enabled so we can detect interaction and move it away.
    noButton.setAttribute('aria-disabled', 'true');
    noButton.setAttribute('tabindex', '-1');

    const blockAndMove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        moveNoButton();
    };

    // Web (mouse/pen)
    noButton.addEventListener('pointerenter', () => moveNoButton());
    noButton.addEventListener('pointerdown', blockAndMove, true);
    noButton.addEventListener('click', blockAndMove, true);

    // Mobile
    noButton.addEventListener('touchstart', blockAndMove, { passive: false, capture: true });

    // Keyboard safety (in case it ever receives focus)
    noButton.addEventListener('keydown', blockAndMove, true);

    window.addEventListener('resize', () => {
        const noBtn = document.querySelector('.no-button');
        if (noBtn && noBtn.classList.contains('is-evasive')) {
            moveNoButton();
        }
    });
});

function handleNoClick() {
    moveNoButton();
}

function handleYesClick() {
    window.location.href = "yes_page.html";
}