import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { serverApiFetch } from "./server-api";

// Share the lookup between the layout and page for a single render.
export const getProfileByHandle = cache(async (handle: string) => {
    let response;
    try {
        response = await serverApiFetch(`/user/profile/handle/${encodeURIComponent(handle)}`);
    } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 404) notFound();
        if (status === 401) redirect("/signin");
        throw error;
    }
    if (!response?.user) notFound();
    return response;
});
