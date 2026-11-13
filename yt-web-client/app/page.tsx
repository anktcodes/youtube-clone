
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

interface Video {
    id: string;
    title: string | null;
    description: string | null;
    processed_file_path: string;
    created_at: string;
}

async function getVideos(): Promise<Video[]> {
    const response = await fetch(`${process.env.API_URL}/api/videos`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch videos");
    }

    const result = await response.json();
    return result.videos;

    }


export default async function Home() {
    const videos = await getVideos();

    return (
        <main className={styles.container}>
            <h1 className={styles.heading}>Videos</h1>

            <div className={styles.videoGrid}>
                {videos.map((video) => (
                    <Link
                        key={video.id}
                        href={`/watch?v=${video.id}`}
                        className={styles.videoCard}
                    >
                        <div className={styles.thumbnail}>
                            <Image
                                src="/thumbnail.gif"
                                alt={video.title || "Video thumbnail"}
                                fill
                                className={styles.thumbnailImage}
                            />
                        </div>

                        <div className={styles.videoInfo}>
                            <h2 className={styles.videoTitle}>
                                {video.title || "Untitled video"}
                            </h2>

                            <p className={styles.uploadDate}>
                                {new Date(video.created_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
