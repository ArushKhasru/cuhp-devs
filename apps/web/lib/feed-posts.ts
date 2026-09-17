type FeedPostIdentity = { id?: string; _id?: string };

// The create response and socket broadcast can arrive in either order.
export function prependPostIfMissing<T extends FeedPostIdentity>(posts: T[], incoming: T): T[] {
    const incomingId = incoming.id || incoming._id;
    if (incomingId && posts.some(post => (post.id || post._id) === incomingId)) {
        return posts;
    }
    return [incoming, ...posts];
}
