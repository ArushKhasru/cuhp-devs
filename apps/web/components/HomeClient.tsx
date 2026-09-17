"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "@repo/ui/components/Footer";
import Navbar from "@repo/ui/components/Navbar";
import ParticleLogo from "@repo/ui/particle/ParticleLogo";
import CardAnimationSection from "./CardAnimationSection";

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function HomeClient() {
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [cardsProgress, setCardsProgress] = useState(0);
    const [hideNavbar, setHideNavbar] = useState(false);

    const cardsSectionRef = useRef<HTMLElement | null>(null);
    const pinContainerRef = useRef<HTMLDivElement | null>(null);
    const lastScrollYRef = useRef(0);
    const progressRef = useRef(0);
    const smoothProgressRef = useRef(0);

    // Smooth scroll state
    const targetScrollRef = useRef(0);
    const currentScrollRef = useRef(0);
    const scrollRafRef = useRef<number | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // Smooth scroll loop
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
            // Lerp factor: lower = slower/smoother (0.06 = very smooth)
            currentScrollRef.current = lerp(currentScrollRef.current, targetScrollRef.current, 0.08);

            if (Math.abs(currentScrollRef.current - targetScrollRef.current) < 0.1) {
                currentScrollRef.current = targetScrollRef.current;
            }

            const scrolled = currentScrollRef.current;
            wrapper.style.transform = `translateY(${-scrolled}px)`;

            // Sync window.scrollY for external refs (navbar hide, progress calc)
            window.history.scrollRestoration = "manual";

            // --- Navbar hide logic ---
            const deltaY = scrolled - lastScrollYRef.current;
            if (scrolled <= 16) {
                setHideNavbar(false);
            } else if (deltaY > 1) {
                setHideNavbar(true);
            } else if (deltaY < -1) {
                setHideNavbar(false);
            }
            lastScrollYRef.current = scrolled;

            // --- Cards progress & Pinning logic ---
            const section = cardsSectionRef.current;
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

                // Lerp progress too for extra silkiness
                smoothProgressRef.current = lerp(smoothProgressRef.current, rawProgress, 0.08);

                if (Math.abs(smoothProgressRef.current - progressRef.current) > 0.001) {
                    progressRef.current = smoothProgressRef.current;
                    setCardsProgress(smoothProgressRef.current);
                }

                // Update pinned container transform imperatively to avoid React state update latency (zero jitter)
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

    // Phase 1 (0 -> ~0.15): cards rise without flipping.
    // Phase 2 (~0.15 -> ~0.30): cards move down only.
    // Phase 3 (~0.30+): cards flip.
    const LIFT_END = 0.15;
    const DROP_ONLY_WINDOW = 0.15;
    const FLIP_START = LIFT_END + DROP_ONLY_WINDOW;
    const SPREAD_WINDOW = 0.23;
    const DROP_WINDOW = DROP_ONLY_WINDOW;
    const FLIP_WINDOW = 0.54;

    const spreadProgress = clamp(cardsProgress / SPREAD_WINDOW, 0, 0.8)
    const moveUpProgress = clamp(cardsProgress / LIFT_END, 0, 1);
    const moveDownProgress = clamp((cardsProgress - LIFT_END) / DROP_WINDOW, 0, 1);
    const flipProgress = clamp((cardsProgress - FLIP_START) / FLIP_WINDOW, 0, 1);
    return (
        <>
            <Navbar
                className={`transition-transform duration-500 ease-out transition-opacity ${heroLoaded && !hideNavbar
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-full opacity-0 pointer-events-none"
                    }`}
            />

            {/* Fixed wrapper — smooth scroll moves this */}
            <div
                ref={wrapperRef}
                className="fixed top-0 left-0 w-full will-change-transform"
            >
                <main className="w-full h-screen flex items-end justify-center px-30 ml-40">
                    <div className="w-full max-w-350">
                        <ParticleLogo
                            width={2000}
                            height={1500}
                            logoSrc="/Eagle3.png"
                            logoWidth={700}
                            logoHeight={700}
                            primaryText="CUHP"
                            secondaryText="DEVS"
                            primaryFontSize={400}
                            secondaryFontSize={150}
                            onLoadComplete={() => setHeroLoaded(true)}
                        />
                    </div>
                </main>

                {/* <section
                    className={`w-full flex flex-col items-center justify-center py-2 px-6 transition-all duration-1000 delay-500 ease-out ${
                        heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                    }`}>
                    <div className="relative group">
                        <div className="relative">
                            <img
                                src="https://cuhimachal.ac.in/asset/images/header%2002.png"
                                className="h-16 md:h-20 w-auto"
                                alt="CUHP"
                            />
                        </div>
                    </div>

                    <div className="mt-8 text-center space-y-2">
                        <h2 className="text-sm md:text-base font-bold tracking-[0.4em] uppercase text-transparent bg-clip-text bg-linear-to-r from-slate-400 via-white to-slate-400">
                            Department of Computer Science and Informatics
                        </h2>
                        <div className="h-px w-24 mx-auto bg-linear-to-r from-transparent via-cyan-500 to-transparent" />
                    </div>
                </section> */}

                <CardAnimationSection
                    heroLoaded={heroLoaded}
                    cardsSectionRef={cardsSectionRef}
                    pinContainerRef={pinContainerRef}
                    spreadProgress={spreadProgress}
                    moveUpProgress={moveUpProgress}
                    moveDownProgress={moveDownProgress}
                    flipProgress={flipProgress}
                />
                <div className="h-[20vh] md:h-[30vh]" />
                <section>
                    <Footer />
                </section>
            </div>
        </>
    );
}
