// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    // Easter egg: click "Yay HTML" to freeze marquee, inline egg transform, then a janky retro boom
    (function() {
        const trigger = document.getElementById('yay-html');
        if (!trigger) return;

        function createParticles(container, count) {
            for (let i = 0; i < count; i += 1) {
                const p = document.createElement('div');
                p.className = 'particle';
                const angle = Math.random() * Math.PI * 2;
                const radius = 120 + Math.random() * 80;
                const tx = Math.cos(angle) * radius + 'px';
                const ty = Math.sin(angle) * radius + 'px';
                p.style.setProperty('--tx', tx);
                p.style.setProperty('--ty', ty);
                p.style.left = '50%';
                p.style.top = '50%';
                p.style.transform = 'translate(-50%, -50%)';
                p.style.animation = `explode ${600 + Math.random()*400}ms ease-out forwards`;
                container.appendChild(p);
                setTimeout(() => p.remove(), 1200);
            }
        }
        
        let finished = false;

        function freezeMarqueeAndRunInline() {
            const marquee = trigger.closest('marquee');
            if (!marquee) return;
            if (finished) {
                // In final state: only copy behavior should run (handled by handleCopy)
                return;
            }
            // Freeze marquee at current position
            const originalSpeed = marquee.getAttribute('scrollamount') || '3';
            marquee.setAttribute('scrollamount', '0');

            // Replace text with an inline egg sequence
            trigger.textContent = '';
            const eggSpan = document.createElement('span');
            eggSpan.className = 'egg-shape';
            trigger.appendChild(eggSpan);
            trigger.classList.add('egg-inline', 'egg-shake');

            // After a short shake, spawn stars and then swap to RSA-2048
            setTimeout(() => {
                trigger.classList.remove('egg-shake');
                // spawn a few ASCII stars
                for (let i = 0; i < 14; i += 1) {
                    const star = document.createElement('span');
                    star.className = 'egg-star';
                    star.textContent = '*';
                    const angle = Math.random() * Math.PI * 2;
                    const r = 50 + Math.random() * 50;
                    star.style.setProperty('--tx', Math.cos(angle) * r + 'px');
                    star.style.setProperty('--ty', Math.sin(angle) * r + 'px');
                    trigger.appendChild(star);
                    setTimeout(() => star.remove(), 900);
                }
                // After 1s, swap to RSA-2048 text, and resume marquee
                setTimeout(() => {
                    trigger.textContent = 'RSA-2048'; // copy-pasteable text
                    marquee.setAttribute('scrollamount', originalSpeed);
                    finished = true;
                    // clicking RSA-2048 copies to clipboard and shows toast
                    trigger.addEventListener('click', handleCopy);
                }, 1000);
            }, 900);

            // No screen-wide overlay — keep everything inline
        }

        function handleCopy(e) {
            e.preventDefault();
            const text = 'RSA-2048';
            try {
                navigator.clipboard.writeText(text);
            } catch (_) {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            const toast = document.getElementById('copy-toast');
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            }
        }

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (finished) {
                handleCopy(e);
            } else {
                freezeMarqueeAndRunInline();
            }
        });
    })();
    // Creative visitor counter with a 47-themed transform.
    // Uses CountAPI (free, no-auth) for global counting on GitHub Pages, with localStorage fallback.
    (function() {
        const rawEl = document.getElementById('hit-raw');
        const fxEl = document.getElementById('hit-fx');
        if (!rawEl || !fxEl) return;

        const namespace = 'alexknight_personal_site';
        const key = 'visits';

        function transform(n) {
            // f(n) = floor(max(0, tanh((n*47+1337)/89) + 0.25*(sin(n/47)+0.5*cos(n/9))) * 1e6)
            const t = Math.tanh((n * 47 + 1337) / 89) + 0.25 * (Math.sin(n / 47) + 0.5 * Math.cos(n / 9));
            const val = Math.max(0, t) * 1e6;
            return Math.floor(val);
        }

        function render(n) {
            rawEl.textContent = Number(n).toLocaleString();
            fxEl.textContent = transform(Number(n)).toLocaleString();
        }

        // Try CountAPI (xyz then dev) with timeout; fallback to localStorage if it fails
        const endpoints = [
            `https://api.countapi.xyz/hit/${namespace}/${key}`,
            `https://api.countapi.dev/hit/${namespace}/${key}`
        ];

        function withTimeout(promise, ms) {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), ms);
            return fetch(promise, { cache: 'no-store', signal: ctrl.signal })
                .finally(() => clearTimeout(t));
        }

        (async function resolveCount() {
            for (const endpoint of endpoints) {
                try {
                    const res = await withTimeout(endpoint, 6000);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    if (data && typeof data.value === 'number') {
                        render(data.value);
                        wireGuess(data.value);
                        return;
                    }
                } catch (err) {
                    // try next endpoint
                }
            }
            // Fallback: localStorage per-browser counter
            try {
                const lsKey = `${namespace}_${key}`;
                const current = parseInt(localStorage.getItem(lsKey) || '0', 10) + 1;
                localStorage.setItem(lsKey, String(current));
                render(current);
                wireGuess(current);
            } catch (e) {
                render(1);
                wireGuess(1);
            }
        })();

        function wireGuess(actual) {
            const input = document.getElementById('n-guess');
            const button = document.getElementById('n-guess-btn');
            const feedback = document.getElementById('n-feedback');
            if (!input || !button || !feedback) return;

            const check = () => {
                const raw = (input.value || '').trim();
                // Easter egg: accept exact 'RSA-2048' as special input
                if (raw === 'RSA-2048') {
                    triggerRsaCelebration();
                    return;
                }

                const guess = parseInt(raw, 10);
                if (Number.isNaN(guess)) {
                    feedback.textContent = 'Enter a number to guess n.';
                    feedback.style.color = '#a00';
                    return;
                }
                if (guess === Number(actual)) {
                    feedback.textContent = 'Great use of GPT!';
                    feedback.style.color = '#0a0';
                } else {
                    feedback.textContent = 'Math is hard, try again.';
                    feedback.style.color = '#a00';
                }
            };

            button.addEventListener('click', check);
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    check();
                }
            });
            function triggerRsaCelebration() {
                // Create left image placeholder and right messages if not present
                const aboutSection = document.getElementById('about');
                if (!aboutSection) return;

                // Left placeholder area (use Cookie Monster image as placeholder)
                let leftSlot = document.getElementById('rsa-left-slot');
                if (!leftSlot) {
                    leftSlot = document.createElement('div');
                    leftSlot.id = 'rsa-left-slot';
                    leftSlot.style.border = '1px dashed #999';
                    leftSlot.style.margin = '20px 0';
                    leftSlot.style.display = 'block';
                    leftSlot.style.background = "url('Photos/cookiemonster.jpg') center / cover no-repeat, #fafafa";
                    leftSlot.title = 'Cookie Monster';
                    const mainCol = aboutSection.querySelector('.about-main');
                    if (mainCol) {
                        mainCol.appendChild(leftSlot);
                    }
                } else {
                    // Ensure it uses the updated tall height if it already existed
                    leftSlot.style.background = "url('Photos/cookiemonster.jpg') center / cover no-repeat, #fafafa";
                }

                // Fit height precisely to the available blank space above the footer
                try {
                    const aboutSectionBottom = aboutSection.getBoundingClientRect().bottom + window.scrollY;
                    const footer = document.querySelector('footer');
                    const footerTop = footer ? (footer.getBoundingClientRect().top + window.scrollY) : (aboutSectionBottom + 400);
                    const padding = 40; // leave a little breathing room
                    const targetHeight = Math.max(240, footerTop - aboutSectionBottom - padding);
                    leftSlot.style.height = `${targetHeight}px`;
                } catch (_) {
                    leftSlot.style.height = '480px';
                }

                // Right messages under the photo area OR under image if space created
                const sidebar = document.querySelector('.about-sidebar');
                if (sidebar) {
                    let title = document.getElementById('rsa-title');
                    if (!title) {
                        title = document.createElement('div');
                        title.id = 'rsa-title';
                        title.textContent = "You're a smart cookie!";
                        title.style.fontSize = '22px';
                        title.style.fontWeight = 'bold';
                        title.style.marginTop = '16px';
                        sidebar.appendChild(title);
                    }

                    let subtitle = document.getElementById('rsa-subtitle');
                    if (!subtitle) {
                        subtitle = document.createElement('div');
                        subtitle.id = 'rsa-subtitle';
                        subtitle.textContent = 'More Easter eggs to come...';
                        subtitle.style.marginTop = '6px';
                        sidebar.appendChild(subtitle);
                    }
                }
                feedback.textContent = '';
            }
        }
    })();

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            
            // Remove active class from all links and sections
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked link and corresponding section
            this.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
});

// Project expansion functionality
function toggleProject(element) {
    const details = element.parentElement.nextElementSibling;
    const isVisible = details.classList.contains('show');
    
    // Close all other project details
    document.querySelectorAll('.project-details').forEach(detail => {
        detail.classList.remove('show');
    });
    
    // Toggle current project details
    if (isVisible) {
        details.classList.remove('show');
    } else {
        details.classList.add('show');
    }
}

// Essay expansion functionality
function toggleEssay(element) {
    const details = element.parentElement.nextElementSibling;
    const isVisible = details.classList.contains('show');
    
    // Close all other essay details
    document.querySelectorAll('.essay-details').forEach(detail => {
        detail.classList.remove('show');
    });
    
    // Toggle current essay details
    if (isVisible) {
        details.classList.remove('show');
    } else {
        details.classList.add('show');
    }
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Do not hijack arrow keys when focused inside inputs or textareas
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
        return; // let the input handle arrows naturally
    }

    const activeLink = document.querySelector('.nav-link.active');
    const navLinks = document.querySelectorAll('.nav-link');
    const currentIndex = Array.from(navLinks).indexOf(activeLink);
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : navLinks.length - 1;
        navLinks[prevIndex].click();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < navLinks.length - 1 ? currentIndex + 1 : 0;
        navLinks[nextIndex].click();
    }
});

// Close expanded items when clicking outside
document.addEventListener('click', function(e) {
    const projectLinks = document.querySelectorAll('.project-link');
    const essayLinks = document.querySelectorAll('.essay-link');
    
    // Check if click is outside of project items
    let clickedInsideProject = false;
    projectLinks.forEach(link => {
        const projectItem = link.closest('.project-item');
        if (projectItem && projectItem.contains(e.target)) {
            clickedInsideProject = true;
        }
    });
    
    // Check if click is outside of essay items
    let clickedInsideEssay = false;
    essayLinks.forEach(link => {
        const essayItem = link.closest('.essay-item');
        if (essayItem && essayItem.contains(e.target)) {
            clickedInsideEssay = true;
        }
    });
    
    // Close project details if clicked outside
    if (!clickedInsideProject) {
        document.querySelectorAll('.project-details').forEach(detail => {
            detail.classList.remove('show');
        });
    }
    
    // Close essay details if clicked outside
    if (!clickedInsideEssay) {
        document.querySelectorAll('.essay-details').forEach(detail => {
            detail.classList.remove('show');
        });
    }
}); 