document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP ScrollTrigger with Lenis
    gsap.registerPlugin(ScrollTrigger);

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // 2. Cinematic Hero Entrance
    const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
    
    heroTl.from(".hero-badge", {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.2
    })
    .from(".line-inner", {
        y: "110%",
        duration: 1.2,
        stagger: 0.15
    }, "-=0.8")
    .from(".hero-desc", {
        y: 20,
        opacity: 0,
        duration: 1
    }, "-=0.8")
    .from(".hero-cta", {
        y: 20,
        opacity: 0,
        duration: 1
    }, "-=0.8");

    // 3. Header Scroll Effect
    ScrollTrigger.create({
        start: 'top -50',
        end: 99999,
        toggleClass: { className: 'scrolled', targets: '#header' }
    });

    // 4. Deep Parallax Background
    gsap.to(".parallax-bg", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // 5. Editorial Split-Screen Pinning (Desktop Only)
    ScrollTrigger.matchMedia({
        "(min-width: 901px)": function() {
            ScrollTrigger.create({
                trigger: ".split-section",
                start: "top 150px",
                end: "bottom bottom",
                pin: ".split-left",
                pinSpacing: false
            });
        }
    });

    // 6. Generic Text/Element Reveals on Scroll
    const revealElements = document.querySelectorAll('.reveal-text');
    revealElements.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
            },
            y: 40,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    const revealCards = document.querySelectorAll('.reveal-card, .step-card');
    revealCards.forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(1.2)"
        });
    });

    const revealScales = document.querySelectorAll('.reveal-scale');
    revealScales.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
            },
            scale: 0.95,
            y: 30,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // 7. Animated Number Counters
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        ScrollTrigger.create({
            trigger: counter,
            start: "top 85%",
            once: true,
            onEnter: () => {
                gsap.to(counter, {
                    innerHTML: target,
                    duration: 2,
                    snap: { innerHTML: 1 },
                    ease: "power2.out"
                });
            }
        });
    });
});
