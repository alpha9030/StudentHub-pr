/**
 * StudentHub Interactive Custom Cursor
 * Implements smooth cursor lag, magnetic card effects, hover states, and click ripples.
 */

(function() {
    // Check if device supports coarse pointer (touch devices)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return; // Do not initialize custom cursor on touch devices

    window.addEventListener('DOMContentLoaded', () => {
        // Create custom cursor elements if they do not exist
        let cursor = document.getElementById('custom-cursor');
        let cursorDot = document.getElementById('custom-cursor-dot');

        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'custom-cursor';
            cursor.className = 'custom-cursor';
            document.body.appendChild(cursor);
        }

        if (!cursorDot) {
            cursorDot = document.createElement('div');
            cursorDot.id = 'custom-cursor-dot';
            cursorDot.className = 'custom-cursor-dot';
            document.body.appendChild(cursorDot);
        }

        // Coordinates
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let isHovering = false;

        // Make cursor visible on first move
        let hasMoved = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (!hasMoved) {
                hasMoved = true;
                cursor.style.opacity = '1';
                cursorDot.style.opacity = '1';
            }

            // Move the dot instantly
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        // Smooth translation of the outer cursor circle (linear interpolation)
        function animateCursor() {
            // Lerp formula: current = current + (target - current) * factor
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;

            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';

            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effect on important UI elements
        const hoverTargets = 'a, button, .btn, .track-card, .quick-action-btn, input[type="checkbox"], input[type="text"], select, textarea, .header-logo, .trivia-option';
        
        function updateHoverListeners() {
            const elements = document.querySelectorAll(hoverTargets);
            elements.forEach(elem => {
                // Avoid duplicating listeners
                if (elem.dataset.cursorBound) return;
                elem.dataset.cursorBound = 'true';

                elem.addEventListener('mouseenter', () => {
                    cursor.classList.add('hover');
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(0.5)';
                });

                elem.addEventListener('mouseleave', () => {
                    cursor.classList.remove('hover');
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                });

                // Magnetic effect on small buttons
                if (elem.classList.contains('btn') || elem.tagName === 'BUTTON' || elem.classList.contains('quick-action-btn')) {
                    elem.addEventListener('mousemove', (e) => {
                        const rect = elem.getBoundingClientRect();
                        const x = e.clientX - rect.left - rect.width / 2;
                        const y = e.clientY - rect.top - rect.height / 2;
                        
                        // Translate the button slightly towards the cursor
                        elem.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
                    });

                    elem.addEventListener('mouseleave', () => {
                        elem.style.transform = 'translate(0px, 0px)';
                    });
                }
            });
        }

        updateHoverListeners();

        // Re-bind listeners on DOM mutations (when views change dynamically)
        const observer = new MutationObserver(() => {
            updateHoverListeners();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Click Ripple effect
        window.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'cursor-ripple-effect';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';
            document.body.appendChild(ripple);

            // Remove ripple after animation finishes
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });

        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            cursorDot.style.opacity = '0';
        });

        document.addEventListener('mouseenter', () => {
            if (hasMoved) {
                cursor.style.opacity = '1';
                cursorDot.style.opacity = '1';
            }
        });
    });
})();
