"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

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

export default function DevContributionsSection() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const onScroll = () => {
            const offsetTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const viewportHeight = window.innerHeight || 1;
            const pinDuration = Math.max(1, sectionHeight - viewportHeight);
            const scrolled = window.scrollY;

            setProgress(clamp((scrolled - offsetTop) / pinDuration, 0, 1));
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    const count = developers.length;
    const segment = 1 / count;

    return (
        <section
            ref={sectionRef}
            className="relative w-full"
            style={{ height: `${count * 100}vh` }}
        >
            {/* Pinned viewport — stays put while scrolling through this section */}
            <div className="sticky top-0 z-20 h-screen w-full overflow-hidden">
                {developers.map((dev, i) => {
                    const segStart = i * segment;
                    const local = clamp((progress - segStart) / segment, 0, 1);

                    // fade/slide in over the first 25% of this card's slot,
                    // hold steady through the middle (the "stop"),
                    // fade/slide out over the last 25%
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

                    // skip rendering cards well outside their active window
                    if (progress < segStart - segment * 0.1 || progress > segStart + segment * 1.1) {
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
                            <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-12 shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
                                {/* Dev image — left */}
                                <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-white/15 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
                                    <img
                                        src={dev.photo}
                                        alt={dev.name}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                </div>

                                {/* Contribution — right */}
                                <div className="text-left">
                                    <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-cyan-300/70">
                                        {dev.role}
                                    </p>
                                    <h3 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white">
                                        {dev.name}
                                    </h3>
                                    <div className="mt-5 h-px w-20 bg-gradient-to-r from-cyan-400/70 to-transparent" />
                                    <p className="mt-6 text-base md:text-lg leading-relaxed text-white/70">
                                        {dev.contribution}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}