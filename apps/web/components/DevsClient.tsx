"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@repo/ui/components/Navbar";
import Footer from "@repo/ui/components/Footer";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const developers = [
    {
        name: "Developer 01",
        role: "Core Team",
        photo: "/developer-0.jpg",
        contribution:
            "Led the design system and built the particle logo animation from scratch, tying together WebGL rendering with React state.",
    },
    {
        name: "Developer 02",
        role: "Core Team",
        photo: "/developer-1.jpg",
        contribution:
            "Architected the backend API and database schema, and set up the CI/CD pipeline used across every repo in the org.",
    },
    {
        name: "Developer 03",
        role: "Core Team",
        photo: "/developer-2.jpg",
        contribution:
            "Owns the scroll choreography across the site — the pinned sections, smooth-scroll wrapper, and card transitions all run through code they wrote.",
    },
];

export default function DevsClient() {
    const [progress, setProgress] = useState(0);
    const [hideNavbar, setHideNavbar] = useState(false);

    const sectionRef = useRef<HTMLElement | null>(null);
    const pinContainerRef = useRef<HTMLDivElement | null>(null);
    const lastScrollYRef = useRef(0);
    const progressRef = useRef(0);
    const smoothProgressRef = useRef(0);

    // Smooth scroll state
    const targetScrollRef = useRef(0);
    const currentScrollRef = useRef(0);
    const scrollRafRef = useRef<number | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        // Set page height from wrapper
        const setBodyHeight = () => {
            document.body.style.height = `${wrapper.scrollHeight}px`;
        };

        setBodyHeight();
        const resizeObs = new ResizeObserver(setBodyHeight);
        resizeObs.observe(wrapper);

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            targetScrollRef.current = clamp(
                targetScrollRef.current + e.deltaY * 1.5,
                0,
                wrapper.scrollHeight - window.innerHeight
            );
        };

        // Touch support
        let touchStartY = 0;
        const onTouchStart = (e: TouchEvent) => {
            const touch = e.touches.item(0);
            if (!touch) return;
            touchStartY = touch.clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches.item(0);
            if (!touch) return;
            const delta = touchStartY - touch.clientY;
            touchStartY = touch.clientY;
            targetScrollRef.current = clamp(
                targetScrollRef.current + delta * 2.0,
                0,
                wrapper.scrollHeight - window.innerHeight
            );
        };

        const smoothLoop = () => {
            currentScrollRef.current = lerp(currentScrollRef.current, targetScrollRef.current, 0.08);

            if (Math.abs(currentScrollRef.current - targetScrollRef.current) < 0.1) {
                currentScrollRef.current = targetScrollRef.current;
            }

            const scrolled = currentScrollRef.current;
            wrapper.style.transform = `translateY(${-scrolled}px)`;

            // Sync scrollRestoration
            window.history.scrollRestoration = "manual";

            // Navbar hide logic
            const deltaY = scrolled - lastScrollYRef.current;
            if (scrolled <= 16) {
                setHideNavbar(false);
            } else if (deltaY > 1) {
                setHideNavbar(true);
            } else if (deltaY < -1) {
                setHideNavbar(false);
            }
            lastScrollYRef.current = scrolled;

            // Section progress & pinning logic
            const section = sectionRef.current;
            if (section) {
                const offsetTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const viewportHeight = window.innerHeight || 1;
                const pinDuration = Math.max(0, sectionHeight - viewportHeight);

                let rawProgress = 0;
                let translation = 0;

                if (scrolled < offsetTop) {
                    rawProgress = 0;
                    translation = 0;
                } else if (scrolled >= offsetTop && scrolled <= offsetTop + pinDuration) {
                    translation = scrolled - offsetTop;
                    rawProgress = pinDuration > 0 ? (scrolled - offsetTop) / pinDuration : 1;
                } else {
                    translation = pinDuration;
                    rawProgress = 1;
                }

                // Lerp progress
                smoothProgressRef.current = lerp(smoothProgressRef.current, rawProgress, 0.08);

                if (Math.abs(smoothProgressRef.current - progressRef.current) > 0.001) {
                    progressRef.current = smoothProgressRef.current;
                    setProgress(smoothProgressRef.current);
                }

                if (pinContainerRef.current) {
                    pinContainerRef.current.style.transform = `translateY(${translation}px)`;
                }
            }

            scrollRafRef.current = requestAnimationFrame(smoothLoop);
        };

        scrollRafRef.current = requestAnimationFrame(smoothLoop);

        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });

        return () => {
            resizeObs.disconnect();
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            document.body.style.height = "";
            if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
        };
    }, []);

    const count = developers.length;
    const segment = 1 / count;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary-custom/30 overflow-x-hidden">
            <Navbar
                className={`transition-transform duration-500 ease-out transition-opacity ${
                    !hideNavbar
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-full opacity-0 pointer-events-none"
                }`}
            />

            {/* Smooth Scroll Content Wrapper */}
            <div
                ref={wrapperRef}
                className="fixed top-0 left-0 w-full will-change-transform"
            >
                {/* Intro Page Header */}
                <header className="relative w-full h-[60vh] flex flex-col items-center justify-center text-center px-6 pt-16">
                    <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-primary-custom">
                        Department of Computer Science & Informatics
                    </p>
                    <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        Our Core Developers
                    </h1>
                    <div className="mt-6 h-px w-24 bg-gradient-to-r from-transparent via-primary-custom to-transparent" />
                    <p className="mt-6 text-sm md:text-base text-slate-400 max-w-lg leading-relaxed">
                        Meet the students and developers driving the community projects and tech stack forward.
                    </p>
                </header>

                {/* Developer Cards Section */}
                <section
                    ref={sectionRef}
                    className="relative w-full min-h-[300vh]"
                >
                    {/* Sticky Container Wrapper */}
                    <div
                        ref={pinContainerRef}
                        className="sticky top-0 z-20 h-screen w-full overflow-hidden flex items-center justify-center"
                    >
                        {/* Spotlight background decoration */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none opacity-50 dark:opacity-35">
                            <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full bg-primary-custom/20 blur-[100px] transition-colors duration-500" />
                            <div className="absolute bottom-[30%] right-[30%] w-[600px] h-[600px] rounded-full bg-primary-custom/15 blur-[120px] transition-colors duration-500" />
                        </div>

                        {developers.map((dev, i) => {
                            const segStart = i * segment;
                            const local = clamp((progress - segStart) / segment, 0, 1);

                            // fade/slide in/out transitions
                            const IN = 0.25;
                            const OUT = 0.75;

                            let opacity = 1;
                            let translateY = 0;

                            if (local < IN) {
                                const t = local / IN;
                                opacity = t;
                                translateY = (1 - t) * 60;
                            } else if (local > OUT) {
                                const t = (local - OUT) / (1 - OUT);
                                opacity = 1 - t;
                                translateY = -t * 60;
                            }

                            // skip rendering cards well outside active window
                            if (progress < segStart - segment * 0.15 || progress > segStart + segment * 1.15) {
                                return null;
                            }

                            return (
                                <div
                                    key={dev.photo}
                                    className="absolute inset-0 flex items-center justify-center px-6 md:px-16"
                                    style={{
                                        opacity,
                                        transform: `translateY(${translateY}px)`,
                                        pointerEvents: opacity > 0.5 ? "auto" : "none",
                                    }}
                                >
                                    <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md p-6 md:p-12 shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
                                        {/* Dev image — left */}
                                        <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
                                            <img
                                                src={dev.photo}
                                                alt={dev.name}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        </div>

                                        {/* Contribution — right */}
                                        <div className="text-left">
                                            <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-primary-custom/80">
                                                {dev.role}
                                            </p>
                                            <h3 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white">
                                                {dev.name}
                                            </h3>
                                            <div className="mt-5 h-px w-20 bg-gradient-to-r from-primary-custom to-transparent" />
                                            <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-300">
                                                {dev.contribution}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="h-[20vh] md:h-[30vh]" />
                <section>
                    <Footer />
                </section>
            </div>
        </div>
    );
}