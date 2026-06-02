/* --- GLOBAL APPLICATION STATE --- */
let propertiesData = []; // Loaded asynchronously from properties.json
let activeCategoryFilter = "Buy"; // Matches default active structural tab
let savedBookmarksArray = []; // Tracks bookmarked item IDs

/* --- DATA ASYNC FETCHER ENGINE --- */
async function loadPropertyDatabase() {
    try {
        const response = await fetch('properties.json');
        if (!response.ok) throw new Error('Database pipeline connection failed.');
        propertiesData = await response.json();
        
        // Populate initial tools data sets drop-downs dynamically 
        populateDropdownOptions();
        
        // Execute initial target listing generation
        filterProperties();
    } catch (error) {
        console.error('Error initialization structure:', error);
        // Fallback banner notice if running code directly without local web server
        const grid = document.getElementById('propertyGrid');
        if(grid) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:#e53935;">
                <i class="fa-solid fa-triangle-exclamation"></i> <strong>Security Access Restriction:</strong> 
                Browsers block internal JSON requests when opening HTML files directly from folders (C://). 
                Please run your project directory using VS Code Live Server extension to test real-time data loading.
            </p>`;
        }
    }
}

/* --- DYNAMIC GRID RENDERING --- */
function renderProperties(dataList) {
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if(dataList.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-muted);">No active properties match your exact search metrics under "${activeCategoryFilter}". Try clearing filter dropdowns.</p>`;
        return;
    }

    dataList.forEach(item => {
        const isBookmarked = savedBookmarksArray.includes(item.id);
        const card = document.createElement('div');
        card.className = 'property-card';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <span class="badge-rera"><i class="fa-solid fa-shield-halved"></i> Verified Listing</span>
                <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(this, ${item.id})" title="Bookmark Space">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'">
            </div>
            <div class="card-body">
                <div class="card-title-row">
                    <h4 class="card-title">${item.title}</h4>
                    <span class="card-price" style="font-size:1.15rem; color:var(--primary); font-weight:700;">${item.priceText}</span>
                </div>
                <p class="card-location"><i class="fa-solid fa-location-dot"></i> ${item.city}, India</p>
                <div class="card-features">
                    <span><i class="fa-solid fa-vector-square"></i> ${item.features}</span>
                </div>
                <div class="card-footer">
                    <span style="font-size:0.85rem; font-weight:600;"><i class="fa-solid fa-star" style="color:#ffb300;"></i> ${item.rating}</span>
                    <button class="btn-view-detail" onclick="openModal(${item.id})">Quick View</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* --- DYNAMIC FILTER CONTROLLER (TAB + DROPDOWNS INTEGRATED) --- */
function filterProperties() {
    const targetCity = document.getElementById('filterCity').value;
    const targetPrice = document.getElementById('filterPrice').value;
    const targetType = document.getElementById('filterType').value;

    const filtered = propertiesData.filter(p => {
        const categoryMatch = p.category === activeCategoryFilter;
        const cityMatch = !targetCity || p.city === targetCity;
        const typeMatch = !targetType || p.type === targetType;
        const priceMatch = !targetPrice || p.priceCode === targetPrice;
        return categoryMatch && cityMatch && typeMatch && priceMatch;
    });

    renderProperties(filtered);
}

/* --- ACTIVE TAB ROUTING CONTROLLER --- */
function handleTabSwitch(clickedTab) {
    const searchTabs = document.querySelectorAll('.search-tabs .tab-label');
    searchTabs.forEach(t => t.classList.remove('active'));
    
    clickedTab.classList.add('active');
    activeCategoryFilter = clickedTab.getAttribute('data-category');
    
    // Auto execute layout re-evaluations instantly on tab change
    filterProperties();
}

/* --- REAL-TIME BOOKMARK SYSTEM --- */
function toggleBookmark(btn, id) {
    if(window.event){
         window.event.stopPropagation();
        }
    // Block closing action bubble traps
    const index = savedBookmarksArray.indexOf(id);
    
    if (index === -1) {
        savedBookmarksArray.push(id);
        btn.classList.add('bookmarked');
    } else {
        savedBookmarksArray.splice(index, 1);
        btn.classList.remove('bookmarked');
    }
    
    // Update structural navigation tracking indicator badge element
    const counterElement= document.getElementById('bookmarkCounter');
    if(counterElement){
        counterElement.innerText = savedBookmarksArray.length; }
}

/* --- RENDER BOOKMARKED ITEMS VIA FILTER OVERRIDE --- */
function viewSavedProperties() {
    const bookmarkedItems = propertiesData.filter(p => savedBookmarksArray.includes(p.id));
    
    // Temporarily clear tab active style visual cues to show user they are viewing a custom filtered list
    document.querySelectorAll('.search-tabs .tab-label').forEach(t => t.classList.remove('active'));
    
    renderProperties(bookmarkedItems);
    
    // If empty dashboard occurs, inject target text context safely
    if(bookmarkedItems.length === 0) {
        document.getElementById('propertyGrid').innerHTML = `
            <p style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-muted);">
                <i class="fa-solid fa-heart-crack"></i> Your Bookmarked Spaces tray is empty. Tap the heart icons on property listings to save items!
            </p>`;
    }
}

/* --- TOOL SETUP ENGINE POPULATION --- */
function populateDropdownOptions() {
    const comp1 = document.getElementById('compare1');
    const comp2 = document.getElementById('compare2');
    if(!comp1 || !comp2) return;
    
    comp1.innerHTML = '';
    comp2.innerHTML = '';
    
    propertiesData.forEach((p, idx) => {
        let opt1 = document.createElement('option');
        opt1.value = idx; opt1.innerText = `${p.title} (${p.city})`;
        let opt2 = opt1.cloneNode(true);
        
        comp1.appendChild(opt1);
        comp2.appendChild(opt2);
    });
    if(comp2.options[1]) comp2.options[1].selected = true;
}

/* --- MODAL DIALOG MANAGEMENT --- */
function openModal(id) {
    const modal = document.getElementById('propertyModal');
    const data = propertiesData.find(p => p.id === id);
    if(!data || !modal) return;
    
    document.getElementById('modalTitle').innerText = data.title;
    document.getElementById('modalPrice').innerText = `Valuation Scale: ${data.priceText}`;
    document.getElementById('modalDesc').innerText = data.desc;
    document.getElementById('modalTransit').innerText = data.transit;
    document.getElementById('modalImg').src = data.image;

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('propertyModal');
    if (modal) modal.classList.remove('active');
}

/* --- MATHEMATICAL ENGINE (EMI CALCULATOR) --- */
function calculateEMI() {
    const P = parseFloat(document.getElementById('emiAmount').value);
    const annualRate = parseFloat(document.getElementById('emiRate').value);
    const years = parseFloat(document.getElementById('emiTenure').value);

    if(isNaN(P) || isNaN(annualRate) || isNaN(years)) return;

    const R = (annualRate / 12) / 100;
    const N = years * 12;
    const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    
    document.getElementById('emiOutput').innerText = `₹${Math.round(emi).toLocaleString('en-IN')} / mo`;
}

/* --- COMPARISON CORE ENGINE --- */
function runComparison() {
    const idx1 = document.getElementById('compare1').value;
    const idx2 = document.getElementById('compare2').value;
    if(!propertiesData[idx1] || !propertiesData[idx2]) return;

    const p1 = propertiesData[idx1];
    const p2 = propertiesData[idx2];
    const container = document.getElementById('comparisonResult');
    if (!container) return;
    
    container.innerHTML = `
        <table style="width:100%; border-collapse:collapse; text-align:left;">
            <tr style="border-bottom:1px solid var(--border-color); font-weight:700;">
                <th style="padding:6px 0;">Specification</th>
                <th>${p1.title}</th>
                <th>${p2.title}</th>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 0; color:var(--text-muted);">Metro Location</td>
                <td>${p1.city}</td>
                <td>${p2.city}</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 0; color:var(--text-muted);">Valuation Scale</td>
                <td>${p1.priceText}</td>
                <td>${p2.priceText}</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 0; color:var(--text-muted);">Configuration</td>
                <td>${p1.features.split('•')[0]}</td>
                <td>${p2.features.split('•')[0]}</td>
            </tr>
        </table>
    `;
}

/* --- HERO TEXT ANIMATOR (Typing Effect) --- */
const words = ["Dream Home.", "Perfect Investment.", "Future Space."];
let wordIdx = 0, charIdx = 0, isDeleting = false;

function typeAnimation() {
    const currentWord = words[wordIdx];
    const element = document.getElementById('typingElement');
    if (!element) return;
    
    if (isDeleting) {
        element.innerText = currentWord.substring(0, charIdx - 1);
        charIdx--;
    } else {
        element.innerText = currentWord.substring(0, charIdx + 1);
        charIdx++;
    }

    if (!isDeleting && charIdx === currentWord.length) {
        isDeleting = true;
        setTimeout(typeAnimation, 1800);
    } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        setTimeout(typeAnimation, 400);
    } else {
        setTimeout(typeAnimation, isDeleting ? 60 : 120);
    }
}

/* --- INITIALIZATION HOOK RUNNER --- */
document.addEventListener("DOMContentLoaded", () => {
    // Fire JSON database retrieval engine pipeline
    loadPropertyDatabase();
    typeAnimation();
    runComparison();

    // Structural filter button event listener attachments
    document.getElementById('searchBtn').addEventListener('click', filterProperties);
    document.getElementById('calcEmiBtn').addEventListener('click', calculateEMI);
    document.getElementById('compare1').addEventListener('change', runComparison);
    document.getElementById('compare2').addEventListener('change', runComparison);
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('viewBookmarksBtn').addEventListener('click', viewSavedProperties);

    // Modal background overlay close optimization
    const modal = document.getElementById('propertyModal');
    if(modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    // Connect search tab node click array events
    const searchTabs = document.querySelectorAll('.search-tabs .tab-label');
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() { handleTabSwitch(this); });
    });

    // Theme toggle light-dark profile handler
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', targetTheme);
        document.querySelector('#themeToggleBtn i').className = targetTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });

    // Back to top scrolling threshold tracking configuration
    window.addEventListener('scroll', () => {
        const topBtn = document.getElementById('backToTopBtn');
        if (topBtn) {
            if(window.scrollY > 400) topBtn.classList.add('visible');
            else topBtn.classList.remove('visible');
        }
    });

    // --- PLACE INSIDE YOUR DOMContentLoaded LISTENER IN script.js ---
const stats = document.querySelectorAll('.stat-number');
const speed = 200; // Lower number means faster counting acceleration

const animateCounters = () => {
    stats.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const inc = Math.ceil(target / speed);

            if (count < target) {
                counter.innerText = count + inc;
                setTimeout(updateCount, 15);
            } else {
                counter.innerText = target + (counter.getAttribute('data-target') === '99' ? '%' : '+');
            }
        };
        updateCount();
    });
};

// Auto-trigger the counter calculations the moment the user scrolls down to them!
const observerOptions = { threshold: 0.5 };
const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target); // Runs animation only once per load
        }
    });
}, observerOptions);

const statsSection = document.querySelector('.stats-counter-row');
if(statsSection) {
    statsObserver.observe(statsSection);
}
});

document.querySelector('.btn-login').addEventListener('click',(e)=>{
    e.preventDefault();
    const username=prompt(" Enter your name to login to property hub: ");
    if(username){
        document.querySelector('.btnlogin').style.backgroundColor="#2e7d32";
    }
});

function initTestimonialSlider(){
    const slides=document.querySelectorAll('.testimonial-slide');
    if(slides.length<=1)  return;

    let currentSlideIndex=0;
    setInterval(()=> {
        slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex=(currentSlideIndex+1)%slides.length;

        slides[currentSlideIndex].classList.add('active');
     },5000);
}
if(document.readyState=='loading'){
  document.addEventListener('DOMContentLoaded',initTestimonialSlider);
}
else{
    initTestimonialSlider();
}