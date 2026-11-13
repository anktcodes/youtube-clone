
interface Video {
    id: string;
    title: string | null;
    description: string | null;
    processed_file_path: string;
    created_at: string;
    video_url: string;
}

async function getVideo(id: string): Promise<Video | null> {
    const response = await fetch(
        `${process.env.API_URL}/api/videos/${id}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        return null;
    }

    const result = await response.json();
    return result.video;
}


export default async function WatchPage({
    searchParams,
}: {
    searchParams: Promise<{ v?: string }>;
}) {
    const { v } = await searchParams;

    if (!v) {
        return <main className="p-8">Video ID is missing.</main>;
    }

    const video = await getVideo(v);

    if (!video) {
        return <main className="p-8">Video not found.</main>;
    }

    return (
        <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
            <div className="mx-auto max-w-5xl">
                <video
                    className="w-full rounded-lg bg-black"
                    src={video.video_url}
                    controls
                    playsInline
                />

                <h1 className="mt-5 text-2xl font-bold text-black dark:text-white">
                    {video.title || "Untitled video"}
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                    Uploaded on:{" "}
                    {new Date(video.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>

                {video.description && (
                    <p className="mt-4 text-zinc-700 dark:text-zinc-300">
                        {video.description}
                    </p>
                )}
            </div>
        </main>
    );
}
