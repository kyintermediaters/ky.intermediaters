document.addEventListener('DOMContentLoaded', () => {
    // Header scroll effect
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for scroll animations (fade-in-up)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: unobserve after animating in once
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with the fade-in-up class
    const animatedElements = document.querySelectorAll('.fade-in-up');
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });



});

// Preloader Logic
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 800);
    }
});

// Capital Slider Logic
document.addEventListener("DOMContentLoaded", () => {
    const slider = document.getElementById("capitalSlider");
    const sliderTitle = document.getElementById("sliderTitle");
    const sliderDesc = document.getElementById("sliderDesc");
    
    if (slider) {
        const ventureData = {
            1: { title: "Local Service Arbitrage", desc: "High-margin, low-overhead service businesses leveraging digital marketing in underserved local markets." },
            2: { title: "Niche E-Commerce / D2C", desc: "Sourcing premium products with high unit margins and strong brand narratives. Focus on high LTV." },
            3: { title: "B2B Micro-SaaS", desc: "Solving a very specific workflow problem for an industry willing to pay recurring subscriptions." },
            4: { title: "Marketplace / Platform", desc: "Capital-intensive structural plays connecting fragmented supply with high-demand consumers." }
        };

        slider.addEventListener("input", (e) => {
            const val = e.target.value;
            sliderTitle.innerText = ventureData[val].title;
            sliderDesc.innerText = ventureData[val].desc;
            
            // Highlight the correct label
            const labels = document.querySelectorAll(".slider-labels span");
            labels.forEach((label, index) => {
                if (index + 1 == val) {
                    label.style.color = "var(--text-primary)";
                    label.style.fontWeight = "800";
                } else {
                    label.style.color = "var(--text-secondary)";
                    label.style.fontWeight = "600";
                }
            });
        });
        
        // Trigger initial state
        slider.dispatchEvent(new Event("input"));
    }
});
