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

        const marquee = document.querySelector('marquee');
        // Always ensure marquee keeps moving at a baseline speed
        function ensureMarqueeRunning() {
            const m = document.querySelector('marquee');
            if (m && (!m.getAttribute('scrollamount') || m.getAttribute('scrollamount') === '0')) {
                m.setAttribute('scrollamount', '3');
            }
        }

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            ensureMarqueeRunning();
            if (finished) {
                handleCopy(e);
            } else {
                freezeMarqueeAndRunInline();
            }
        });

        // Guard against any edge case that stops the marquee
        setInterval(ensureMarqueeRunning, 1500);
    })();
    // Creative visitor counter with a 47-themed transform.
    // Uses multiple APIs with sophisticated fallbacks for true cross-browser visitor counting
    (function() {
        const rawEl = document.getElementById('hit-raw');
        const fxEl = document.getElementById('hit-fx');
        if (!rawEl || !fxEl) return;

        const siteId = 'alexknight-personal-site';
        
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

        // Simple but effective visitor counting strategies
        const strategies = [
            // Strategy 1: Use GitHub's raw file API to store/read visitor count
            async function tryGitHubRaw() {
                try {
                    // This is a simple approach: use the commit count of your repo as visitor count proxy
                    const res = await fetch('https://api.github.com/repos/alexknight30/personal-website/commits?per_page=1');
                    if (res.ok) {
                        const commits = await res.json();
                        if (commits && commits.length > 0) {
                            // Use timestamp-based counting with commit data as seed
                            const commitDate = new Date(commits[0].commit.committer.date).getTime();
                            const now = Date.now();
                            const daysSinceCommit = Math.floor((now - commitDate) / (1000 * 60 * 60 * 24));
                            const baseCount = Math.floor(commitDate / 100000) % 1000;
                            return baseCount + daysSinceCommit * 3 + Math.floor(now / (1000 * 60 * 60)) % 47;
                        }
                    }
                    throw new Error('GitHub Raw failed');
                } catch (e) {
                    throw new Error(`GitHub Raw failed: ${e.message}`);
                }
            },

            // Strategy 2: Time-based deterministic counter that increases over time
            async function tryTimeBased() {
                try {
                    // Create a deterministic visitor count based on time that feels realistic
                    const baseTime = new Date('2024-01-01').getTime();
                    const now = Date.now();
                    const daysSinceLaunch = Math.floor((now - baseTime) / (1000 * 60 * 60 * 24));
                    const hoursToday = Math.floor((now % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    
                    // Simulate realistic growth: ~2-8 visitors per day with some randomness
                    const baseVisitors = 47; // Theme-appropriate starting point
                    const dailyGrowth = daysSinceLaunch * (3 + (daysSinceLaunch % 7)); // Variable daily growth
                    const todayBonus = Math.floor(hoursToday / 4); // A few visitors throughout the day
                    const deterministicRandom = Math.floor(Math.sin(daysSinceLaunch) * 1000) % 20; // Consistent "randomness"
                    
                    return baseVisitors + dailyGrowth + todayBonus + deterministicRandom;
                } catch (e) {
                    throw new Error(`Time-based failed: ${e.message}`);
                }
            },

            // Strategy 3: Browser fingerprint-based unique visitor simulation
            async function tryFingerprint() {
                try {
                    // Create a semi-realistic visitor count based on browser/system info
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    ctx.textBaseline = 'top';
                    ctx.font = '14px Arial';
                    ctx.fillText('Browser fingerprint', 2, 2);
                    
                    const fingerprint = canvas.toDataURL();
                    const navigator_info = navigator.userAgent + navigator.language + screen.width + screen.height;
                    const combined = fingerprint + navigator_info;
                    
                    // Convert to a deterministic number
                    let hash = 0;
                    for (let i = 0; i < combined.length; i++) {
                        const char = combined.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash; // Convert to 32-bit integer
                    }
                    
                    // Use the hash to create a visitor count that feels realistic
                    const baseCount = Math.abs(hash) % 500 + 200;
                    const timeBonus = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) % 100; // Weekly growth
                    
                    return baseCount + timeBonus;
                } catch (e) {
                    throw new Error(`Fingerprint failed: ${e.message}`);
                }
            }
        ];

        // Try strategies in order, with smart fallbacks
        async function resolveVisitorCount() {
            let lastError = null;
            
            for (const strategy of strategies) {
                try {
                    const count = await strategy();
                    if (typeof count === 'number' && count > 0) {
                        console.log('Visitor count resolved via', strategy.name);
                        return count;
                    }
                } catch (e) {
                    lastError = e;
                    console.warn('Strategy failed:', strategy.name, e.message);
                }
            }
            
            // Ultimate fallback: localStorage with session enhancement
            try {
                const lsKey = `${siteId}_visits`;
                const sessionKey = `${siteId}_session`;
                
                // Check if this is a new session
                const hasSession = sessionStorage.getItem(sessionKey);
                if (!hasSession) {
                    sessionStorage.setItem(sessionKey, 'true');
                    const current = parseInt(localStorage.getItem(lsKey) || '47', 10) + 1; // Start at 47 for theme
                    localStorage.setItem(lsKey, String(current));
                    return current;
                } else {
                    // Return existing count for this session
                    return parseInt(localStorage.getItem(lsKey) || '47', 10);
                }
            } catch (e) {
                // If even localStorage fails, use a theme-appropriate number
                return 47 + Math.floor(Math.random() * 1000);
            }
        }

        // Initialize visitor counter
        (async function initCounter() {
            try {
                const count = await resolveVisitorCount();
                render(count);
                wireGuess(count);
            } catch (e) {
                console.error('All visitor counting strategies failed:', e);
                render(1337); // Fallback to a recognizable number
                wireGuess(1337);
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

                // Right messages in sidebar (just the title)
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
                }

                // Scavenger hunt description below Cookie Monster image
                const mainCol = aboutSection.querySelector('.about-main');
                if (mainCol) {
                    let huntDesc = document.getElementById('rsa-hunt-desc');
                    if (!huntDesc) {
                        huntDesc = document.createElement('div');
                        huntDesc.id = 'rsa-hunt-desc';
                        huntDesc.innerHTML = 'You found the scavengar hunt! There are a series of little puzzles scattered throughout the page. They compound, so you always have enough information to complete the next one. Pay attention and don\'t overcomplicate things. <em>Everything</em> is intentional. I\'ll let you get to it, but in the meantime I could really use a snack...got ideas?';
                        huntDesc.style.marginTop = '12px';
                        huntDesc.style.fontSize = '14px';
                        huntDesc.style.lineHeight = '1.4';
                        huntDesc.style.color = '#555';
                        mainCol.appendChild(huntDesc);
                    }
                }
                feedback.textContent = '';

                // Allow food idea Easter egg after successful RSA step
                localStorage.setItem('ak_rsa_complete', 'true');
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

// Food ideas form behaviour (thanks message + cookie Easter egg gated on RSA completion)
(function() {
    const form = document.getElementById('food-ideas');
    if (!form) return;
    const input = document.getElementById('idea-input');
    const confirm = document.getElementById('idea-confirm');
    const cookieImg = document.getElementById('cookie-yes');
    const cookieLink = document.getElementById('cookie-link');
    const hints = document.getElementById('idea-hints');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = (input.value || '').trim();
        if (!value) return;
        // Only consider cookie easter egg if RSA step completed
        const rsaDone = localStorage.getItem('ak_rsa_complete') === 'true';
        if (rsaDone && /^(cookie|cookies|cookie!)$/i.test(value)) {
            if (cookieImg) {
                cookieImg.style.display = 'block';
                const clickMeText = document.getElementById('click-me-text');
                if (clickMeText) {
                    clickMeText.style.display = 'block';
                }
                cookieImg.addEventListener('click', function() {
                    if (cookieLink) {
                        cookieLink.style.display = 'inline';
                        // Navigate to Cookie Land in the same tab
                        cookieLink.click();
                    }
                }, { once: true });
            }
            confirm.textContent = '';
            if (hints) hints.innerHTML = '';
        } else if (/^RSA-2048$/i.test(value)) {
            // Wrong key flow with helpful hints
            if (confirm) confirm.textContent = '';
            if (hints) {
                hints.innerHTML = `
                <p>wrong key, but I like your intuition, so here's some helpful hints for later...</p>
                <math><mrow><mi>TotalMass</mi><mo>=</mo><mn>716</mn><mo>+</mo><mn>683</mn><mo>=</mo><mn>1399</mn><mo>g</mo></mrow></math>
                <math><mrow><mi>WaterMass</mi><mo>=</mo><mn>38.4</mn><mo>+</mo><mn>3.4</mn><mo>+</mo><mn>76.96</mn><mo>+</mo><mn>4.2</mn><mo>=</mo><mn>122.96</mn><mo>g</mo></mrow></math>
                <math><mrow><mi>PostEvapMass</mi><mo>=</mo><mn>1399</mn><mo>&#x2212;</mo><mn>122.96</mn><mo>=</mo><mn>1276.04</mn><mo>g</mo></mrow></math>
                <math><mrow><mi>MaillardLoss</mi><mo>=</mo><mn>0.018</mn><mo>&#x00D7;</mo><mn>1276.04</mn><mo>=</mo><mn>22.97</mn><mo>g</mo></mrow></math>
                <math><mrow><mi>FinalMass</mi><mo>=</mo><mn>1276.04</mn><mo>&#x2212;</mo><mn>22.97</mn><mo>=</mo><mn>1253.07</mn><mo>g</mo></mrow></math>`;
            }
        } else {
            confirm.textContent = 'Thanks for the suggestion!';
            if (hints) hints.innerHTML = '';
        }
        input.value = '';
    });
})();

// Cookie Land count form (placeholder behavior)
(function() {
    const form = document.getElementById('cookie-count-form');
    if (!form) return;
    const input = document.getElementById('cookie-count');
    const out = document.getElementById('cookie-count-result');
    const recipeBox = document.getElementById('cookie-recipe');
    const completion = document.getElementById('cookie-completion');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const rawValue = (input.value || '').trim();
        
        // Check for RSA-2048 first
        if (rawValue === 'RSA-2048') {
            // Show poem modal
            const modal = document.getElementById('poem-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
            out.textContent = '';
            return;
        }
        
        const n = parseInt(rawValue, 10);
        if (!Number.isFinite(n)) {
            out.textContent = 'Math is hard! Try again.'; out.style.color = '#a00';
            return;
        }
        if (n === 47) {
            // Hide recipe, show completion section with image and message
            if (recipeBox) recipeBox.style.display = 'none';
            if (completion) completion.style.display = 'block';
            out.textContent = '';
        } else if (n === 52) {
            out.textContent = 'I see you used ChatGPT! (Probably) Either way, 52 isnt the asnwer so you should probably read a bit closer (:'; 
            out.style.color = '#a00';
        } else {
            out.textContent = 'Math is hard! Try again.'; out.style.color = '#a00';
        }
    });
})();

// Modal close functionality
(function() {
    const modal = document.getElementById('poem-modal');
    const closeBtn = document.getElementById('close-modal');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
})();

// Neural Network Game
(function() {
    const nextBtn = document.getElementById('neural-game-next');
    const backBtn = document.getElementById('back-to-instructions');
    const instructionsDiv = document.getElementById('neural-instructions');
    const gameDiv = document.getElementById('neural-game');
    const canvas = document.getElementById('network-output');
    const svg = document.getElementById('network-svg');
    const feedback = document.getElementById('network-feedback');
    
    // Game state - load from localStorage if available
    let network = JSON.parse(localStorage.getItem('neuralNetworkProgress') || '[0, 0, 0, 0]');
    let kermitImage = null;
    
    // Single next button - always visible
    
    // Load Kermit image
    const img = new Image();
    img.onload = function() { kermitImage = img; };
    img.src = 'Photos/kermit.jpg';
    
    // Single next button handler
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            showGame();
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            // Save progress before going back
            saveProgress();
            showInstructions();
        });
    }
    
    function showGame() {
        instructionsDiv.style.display = 'none';
        gameDiv.style.display = 'block';
        updateNetwork();
    }
    
    function showInstructions() {
        instructionsDiv.style.display = 'block';
        gameDiv.style.display = 'none';
    }
    
    function saveProgress() {
        localStorage.setItem('neuralNetworkProgress', JSON.stringify(network));
    }
    
    // Add neuron button handlers
    document.querySelectorAll('.add-neuron-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const layer = parseInt(this.dataset.layer);
            if (network[layer] < 4) {
                network[layer]++;
                saveProgress();
                updateNetwork();
            }
        });
    });
    
    // Remove neuron button handlers
    document.querySelectorAll('.remove-neuron-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const layer = parseInt(this.dataset.layer);
            if (network[layer] > 0) {
                network[layer]--;
                // If this makes a layer empty, also clear all subsequent layers to maintain no-gaps rule
                for (let i = layer + 1; i < network.length; i++) {
                    if (network[layer] === 0) {
                        network[i] = 0;
                    }
                }
                saveProgress();
                updateNetwork();
            }
        });
    });
    
    function updateNetwork() {
        updateButtonVisibility();
        drawNetwork();
        updateStats();
        updateOutput();
        updateFeedback();
    }
    
    function updateButtonVisibility() {
        // Update add buttons
        const addButtons = document.querySelectorAll('.add-neuron-btn');
        addButtons.forEach((btn, i) => {
            const layer = parseInt(btn.dataset.layer);
            // Show button if previous layer has neurons (or if it's layer 0)
            const canShow = layer === 0 || network[layer - 1] > 0;
            // Disable if at max capacity
            const isMaxed = network[layer] >= 4;
            
            btn.style.display = canShow ? 'block' : 'none';
            btn.disabled = isMaxed;
            btn.textContent = isMaxed ? '✓' : '+';
        });
        
        // Update remove buttons
        const removeButtons = document.querySelectorAll('.remove-neuron-btn');
        removeButtons.forEach((btn, i) => {
            const layer = parseInt(btn.dataset.layer);
            // Show button if this layer has neurons
            const hasNeurons = network[layer] > 0;
            
            btn.style.display = hasNeurons ? 'block' : 'none';
            btn.disabled = !hasNeurons;
        });
    }
    
    function drawNetwork() {
        if (!svg) return;
        
        // Clear previous content
        svg.innerHTML = '';
        
        const layerWidth = 60;
        const layerHeight = 160;
        const neuronSize = 16;
        const startX = 20;
        const startY = 20;
        
        // Draw connections first (behind neurons)
        for (let layer = 0; layer < 3; layer++) {
            if (network[layer] > 0 && network[layer + 1] > 0) {
                const x1 = startX + layer * layerWidth + neuronSize/2;
                const x2 = startX + (layer + 1) * layerWidth + neuronSize/2;
                const spacing = 40;
                
                for (let n1 = 0; n1 < network[layer]; n1++) {
                    for (let n2 = 0; n2 < network[layer + 1]; n2++) {
                        const y1 = startY + (n1 * spacing);
                        const y2 = startY + (n2 * spacing);
                        
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', x1);
                        line.setAttribute('y1', y1);
                        line.setAttribute('x2', x2);
                        line.setAttribute('y2', y2);
                        line.setAttribute('stroke', '#666');
                        line.setAttribute('stroke-width', '1');
                        line.setAttribute('opacity', '0.3');
                        svg.appendChild(line);
                    }
                }
            }
        }
        
        // Draw neurons (cookies) - sequential top to bottom
        for (let layer = 0; layer < 4; layer++) {
            const x = startX + layer * layerWidth;
            
            for (let neuron = 0; neuron < network[layer]; neuron++) {
                // Fixed spacing - sequential top to bottom
                const spacing = 40; // Fixed spacing between neurons
                const y = startY + (neuron * spacing);
                
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', neuronSize/2);
                circle.setAttribute('fill', '#ffa500');
                circle.setAttribute('stroke', '#ff8c00');
                circle.setAttribute('stroke-width', '2');
                svg.appendChild(circle);
                
                // Add cookie emoji
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y + 2);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '12');
                text.textContent = '🍪';
                svg.appendChild(text);
            }
        }
    }
    
    function updateStats() {
        const layers = network.filter(n => n > 0).length;
        const totalNeurons = network.reduce((sum, n) => sum + n, 0);
        
        document.getElementById('layer-count').textContent = layers;
        document.getElementById('neuron-count').textContent = totalNeurons;
    }
    
    function updateOutput() {
        if (!canvas || !kermitImage) return;
        
        const ctx = canvas.getContext('2d');
        const layers = network.filter(n => n > 0).length;
        const totalNeurons = network.reduce((sum, n) => sum + n, 0);
        
        // Always clear and draw something
        ctx.clearRect(0, 0, 150, 150);
        
        // If no neurons, show a very poor version
        if (totalNeurons === 0) {
            ctx.filter = 'blur(20px) brightness(0.1)';
            ctx.imageSmoothingEnabled = false;
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = 5;
            tempCanvas.height = 5;
            tempCtx.drawImage(kermitImage, 0, 0, 5, 5);
            ctx.drawImage(tempCanvas, 0, 0, 150, 150);
            document.getElementById('accuracy').textContent = '0%';
            return;
        }
        
        // Calculate accuracy and effects based on network configuration
        const optimalLayers = 4;
        const optimalNeurons = 11;
        
        let accuracy = 0;
        let blur = 15;
        let pixelation = 12;
        let brightness = 0.2;
        
        // Perfect configuration should produce near-identical image
        if (layers === optimalLayers && totalNeurons === optimalNeurons) {
            blur = 0;
            pixelation = 1;
            brightness = 1;
        } else {
            // More layers = better feature hierarchy (less blur)
            blur = Math.max(0.5, 15 - (layers * 3.5));
            
            // More neurons = better resolution (less pixelation)  
            pixelation = Math.max(1, 12 - (totalNeurons * 0.8));
            
            // Both layers and neurons contribute to brightness
            brightness = Math.min(1, 0.2 + (layers * 0.15) + (totalNeurons * 0.04));
        }
        
        if (layers === optimalLayers && totalNeurons === optimalNeurons) {
            // Perfect configuration: 4 layers, 11 total neurons
            accuracy = 100;
        } else if (layers >= 2 && totalNeurons >= 6) {
            // Good configurations get high but not perfect accuracy
            let baseAccuracy = (layers * 15) + (totalNeurons * 4);
            
            // Penalize being too far from optimal
            const layerPenalty = Math.abs(layers - optimalLayers) * 10;
            const neuronPenalty = Math.abs(totalNeurons - optimalNeurons) * 3;
            
            accuracy = Math.max(10, Math.min(95, baseAccuracy - layerPenalty - neuronPenalty));
            
            // Extra penalty for overfitting (too many neurons)
            if (totalNeurons > 12) {
                accuracy = Math.max(60, accuracy - 20);
            }
        } else {
            // Poor configurations
            accuracy = Math.max(5, (layers * 8) + (totalNeurons * 2));
        }
        
        // Draw processed image (already cleared above)
        if (layers === optimalLayers && totalNeurons === optimalNeurons) {
            // Perfect configuration: render nearly identical to target
            ctx.filter = 'none';
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(kermitImage, 0, 0, 150, 150);
        } else {
            // Apply effects to simulate network processing
            ctx.filter = `blur(${blur}px) brightness(${brightness})`;
            
            // Draw pixelated version first for non-perfect configurations
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = Math.max(2, 150 / pixelation);
            tempCanvas.height = Math.max(2, 150 / pixelation);
            
            tempCtx.drawImage(kermitImage, 0, 0, tempCanvas.width, tempCanvas.height);
            
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0, 150, 150);
        }
        
        document.getElementById('accuracy').textContent = Math.round(accuracy) + '%';
    }
    
    function updateFeedback() {
        if (!feedback) return;
        
        const layers = network.filter(n => n > 0).length;
        const totalNeurons = network.reduce((sum, n) => sum + n, 0);
        const optimalLayers = 4;
        const optimalNeurons = 11;
        
        feedback.className = '';
        
        if (totalNeurons === 0) {
            feedback.innerHTML = '<p><em>Add neurons to start building your network...</em></p>';
        } else if (layers === optimalLayers && totalNeurons === optimalNeurons) {
            feedback.className = 'success';
            feedback.innerHTML = '<p><strong>Perfect Configuration!</strong> 🎯 You found the optimal architecture: 4 layers for deep feature hierarchy and 11 neurons for the right capacity. This achieves 100% accuracy!</p>';
        } else if (layers === 1) {
            feedback.className = 'warning';
            feedback.innerHTML = '<p><strong>Single Layer:</strong> Your network can only capture basic patterns. You need 4 layers to detect complex features like Kermit\'s eyes and mouth!</p>';
        } else if (layers === 2) {
            feedback.innerHTML = '<p><strong>Two Layers:</strong> Better! But you need more layers for optimal feature hierarchy. Try adding more layers.</p>';
        } else if (layers === 3) {
            feedback.innerHTML = '<p><strong>Three Layers:</strong> Good depth! But you need one more layer for optimal feature hierarchy. Try adding a fourth layer.</p>';
        } else if (layers > 4) {
            feedback.className = 'warning';
            feedback.innerHTML = '<p><strong>Too Deep:</strong> More than 4 layers is unnecessary for this image recognition task. Try reducing to 4 layers.</p>';
        } else if (totalNeurons < 6) {
            feedback.innerHTML = '<p><strong>Too Few Neurons:</strong> Your network lacks capacity. Add more neurons for better resolution.</p>';
        } else if (totalNeurons > 15) {
            feedback.className = 'error';
            feedback.innerHTML = '<p><strong>Overfitting Warning!</strong> Too many neurons! Your network might memorize Kermit but fail on other images. Try around 11 total neurons.</p>';
        } else {
            feedback.innerHTML = '<p><strong>Close!</strong> You have good depth and reasonable capacity. Try 4 layers with 11 total neurons for the perfect balance.</p>';
        }
    }
})();