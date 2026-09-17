"use client";

import type { RefObject } from "react";

const developers = [
    {
        name: "Developer 01",
        role: "Core Team",
        photo: "/developer-0.jpg",
    },
    {
        name: "Developer 02",
        role: "Core Team",
        photo: "/developer-1.jpg",
    },
    {
        name: "Developer 03",
        role: "Core Team",
        photo: "/developer-2.jpg",
    },
];

type CardAnimationSectionProps = {
    heroLoaded: boolean;
    cardsSectionRef: RefObject<HTMLElement | null>;
    pinContainerRef: RefObject<HTMLDivElement | null>;
    spreadProgress: number;
    moveUpProgress: number;
    moveDownProgress: number;
    flipProgress: number;
};

export default function CardAnimationSection({
    heroLoaded,
    cardsSectionRef,
    pinContainerRef,
    spreadProgress,
    moveUpProgress,
    moveDownProgress,
    flipProgress,
}: CardAnimationSectionProps) {
    return (
        <section
            id="devs"
            ref={cardsSectionRef}
            className={`relative w-[100%] min-h-[320vh] transition-all duration-1000 delay-700 ease-out ${heroLoaded ? "opacity-100" : "opacity-0"
                }`}
        >
            {/* ── Sticky viewport wrapper ── */}
            <div
                ref={pinContainerRef}
                className="sticky top-0 z-20 h-screen w-full flex items-center justify-center px-6 md:px-8 py-14 will-change-transform"
            >

                {/* ── Glassmorphic card panel ── */}
                <div
                    className="relative mx-auto w-full px-4 py-10 md:px-10 md:py-14
                               shadow-[0_25px_90px_rgba(0,0,0,0.5)]"
                    // FIX 1: removed overflow-hidden so the blurred bg image isn't clipped
                    // FIX 2: added backdrop-blur via inline style to keep glass effect
                    style={{ backdropFilter: "blur(4px)" }}
                >
                    {/* ── Eagle2.svg BLURRED BACKGROUND ── */}
                    {/*
                        FIX 3: Changed from absolute-inset to a pseudo-layer approach.
                        The image wrapper uses overflow-hidden + border-radius so the blur
                        stays contained while the panel itself is no longer overflow-hidden.
                        FIX 4: Replaced opacity-35 (invalid in Tailwind v3) with opacity-30.
                        FIX 5: Reduced dark scrim from bg-black/50 to bg-black/30 so the image shows.
                    */}
                    <div
                        className="absolute inset-0 w-full h-[1000px] overflow-hidden pointer-events-none select-none"
                    >
                        <img
                            src="/Eagle2.svg"
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover opacity-150"
                            // FIX 6: apply blur + scale via inline style (safe from overflow clipping now)
                            style={{ filter: "blur(40px)", transform: "scale(1.3)" }}
                        />
                        {/* FIX 7: lighter scrim so image is actually visible */}
                        <div className="absolute inset-0 bg-black/30" />
                    </div>

                    {/* ── Section heading ── */}
                    <div className="relative z-10 text-center">
                        <p className="text-[0.65rem] md:text-xs uppercase tracking-[0.45em] text-cyan-300/70">
                            CUHP Team
                        </p>
                        <h3 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white">
                            Devs
                        </h3>
                        {/* FIX 8: bg-linear-to-r → bg-gradient-to-r (Tailwind v3 syntax) */}
                        <div className="mt-4 h-px w-28 mx-auto bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
                    </div>

                    {/* ── Cards container ── */}
                    <div className="relative z-10 mt-10 flex justify-center">
                        <div
                            className="relative flex w-[min(96vw,930px)] overflow-visible items-stretch"
                            style={{ perspective: "1800px" }}
                        >
                            {developers.map((developer, index) => {
                                const offset = index - 1; // -1, 0, 1

                                /* ── horizontal spread ── */
                                const translateXPercent = offset * 58 * spreadProgress;

                                /* ── vertical travel ── */
                                const fanLiftY = -20 * Math.abs(offset) * spreadProgress;
                                const moveUpY = -110 * moveUpProgress;
                                const moveDownY = 300 * moveDownProgress;
                                const translateY = moveUpY + moveDownY + fanLiftY;

                                /* ── 3-D flip ── */
                                const rotateY = 180 * flipProgress;

                                /* ── subtle fan rotation ── */
                                const rotateZ = offset * 4 * spreadProgress;

                                /* ── scale ── */
                                const scale = 1 - 0.03 * Math.abs(offset) * spreadProgress;

                                /* ── border radius ──
                                   FIX 9: Properly handle all four corners independently:
                                   - Left card:   top-left & bottom-left always 26px; right corners = innerRadius
                                   - Center card: all corners = innerRadius
                                   - Right card:  top-right & bottom-right always 26px; left corners = innerRadius
                                */
                                const innerRadius = Math.round(26 * spreadProgress);
                                const tl = index === 0 ? 26 : innerRadius;
                                const bl = index === 0 ? 26 : innerRadius;
                                const tr = index === developers.length - 1 ? 26 : innerRadius;
                                const br = index === developers.length - 1 ? 26 : innerRadius;
                                const borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;

                                /* ── background slice of Eagle2.svg ── */
                                const bgPositionX = `${index * 50}%`;

                                /* ── gap between cards ──
                                   FIX 10: use a proper pixel gap that closes to 0 at spreadProgress=0
                                   instead of a tiny negative margin that barely worked.
                                */
                                const cardGap = index !== 0 ? `${Math.round(spreadProgress * 12)}px` : undefined;

                                return (
                                    <article
                                        key={developer.photo}
                                        className="relative aspect-[2/3] w-1/3 [transform-style:preserve-3d]"
                                        style={{
                                            transform: `translateX(${translateXPercent}%) translateY(${translateY}px) rotateZ(${rotateZ}deg) scale(${scale})`,
                                            zIndex: 50 - Math.abs(offset),
                                            marginLeft: cardGap,
                                            // FIX 11: GPU-promote animated cards
                                            willChange: "transform",
                                        }}
                                    >
                                        <div
                                            className="relative h-full w-full [transform-style:preserve-3d]"
                                            style={{ transform: `rotateY(${rotateY}deg)` }}
                                        >
                                            {/* ── FRONT: Eagle2.svg slice ── */}
                                            <div
                                                className="absolute inset-0 overflow-hidden border border-white/15
                                                           [backface-visibility:hidden]
                                                           shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
                                                style={{ borderRadius }}
                                            >
                                                <div
                                                    className="absolute inset-0"
                                                    style={{
                                                        backgroundImage: "url('/Eagle2.svg')",
                                                        backgroundSize: "300% 100%",
                                                        backgroundPosition: `${bgPositionX} center`,
                                                        backgroundRepeat: "no-repeat",
                                                    }}
                                                />
                                                {/* FIX 12: bg-linear-to-t → bg-gradient-to-t */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                            </div>

                                            {/* ── BACK: Developer photo ── */}
                                            <div
                                                className="absolute inset-0 overflow-hidden border border-white/20
                                                           [backface-visibility:hidden] [transform:rotateY(180deg)]
                                                           shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                                                style={{ borderRadius }}
                                            >
                                                <img
                                                    src={developer.photo}
                                                    alt={developer.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                {/* FIX 13: bg-linear-to-t → bg-gradient-to-t */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                                                    <p className="text-[0.6rem] md:text-[0.7rem] tracking-[0.25em] uppercase text-cyan-300/85">
                                                        {developer.role}
                                                    </p>
                                                    <p className="text-sm md:text-xl font-semibold text-white">
                                                        {developer.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
