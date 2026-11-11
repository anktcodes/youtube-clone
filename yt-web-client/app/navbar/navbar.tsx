'use client';

import Image from "next/image";
import styles from "./navbar.module.css";
import Link from "next/link";
import SignIn from "./sign-in";

import { onAuthStateChangedHelper } from "../firebase/firebase";
import { useRef, useState, useEffect } from "react";
import { User } from "firebase/auth";

// for upload feature url generation
import { supabase } from "../lib/supabase";
// import { useRef } from "react";

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    // state to hold the generated upload URL
    const [uploadStatus, setUploadStatus] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleVideoUpload(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!user) {
            setUploadStatus("Please sign in first.");
            return;
        }

        const extension = file.name
            .slice(file.name.lastIndexOf("."))
            .toLowerCase();

        const allowedExtensions = [".mp4", ".mov", ".webm", ".mkv"];

        if (!allowedExtensions.includes(extension)) {
            setUploadStatus("Unsupported video format.");
            return;
        }

        try {
            setUploadStatus("Getting upload URL...");

            // 1. Get Firebase ID token
            const idToken = await user.getIdToken();

            // 2. Request signed URL from backend
            const response = await fetch(
                "https://youtube-clone-p7o3.onrender.com/api/videos/upload-url",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        fileExtension: extension,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to get upload URL");
            }

            console.log("Upload URL generated:", result.fileName);

            // 3. Upload video directly to Supabase
            setUploadStatus("Uploading video...");

            const { data, error } = await supabase.storage
                .from("raw-videos")
                .uploadToSignedUrl(
                    result.path,
                    result.token,
                    file,
                    {
                        contentType: file.type,
                        upsert: false,
                    }
                );

            if (error) throw error;

            console.log("Video uploaded successfully:", data);

            setUploadStatus("Video uploaded successfully!");
        } catch (error) {
            console.error("Video upload failed:", error);

            setUploadStatus(
                error instanceof Error
                    ? error.message
                    : "Video upload failed."
            );
        } finally {
            event.target.value = "";
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper(async (user) => {
            setUser(user);

            if (user) {
                try {
                    const idToken = await user.getIdToken();

                    const response = await fetch(
                        "https://youtube-clone-p7o3.onrender.com/api/users/sync",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${idToken}`,
                            },
                        }
                    );

                    if (!response.ok) {
                        const error = await response.text();
                        throw new Error(error);
                    }

                    const result = await response.json();
                    console.log("User synced successfully:", result.user);
                } catch (error) {
                    console.error("Failed to sync user with backend:", error);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // temporary test function to generate an upload URL for a video file
    async function testUploadUrl(user: User) {
        console.log("1. Button clicked");

        try {
            console.log("2. Getting Firebase token...");

            const idToken = await user.getIdToken();

            console.log("3. Firebase token received");

            const response = await fetch(
                "https://youtube-clone-p7o3.onrender.com/api/videos/upload-url",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ fileExtension: ".mp4" }),
                }
            );

            console.log("4. API response status:", response.status);

            const result = await response.json();

            console.log("5. API response:", result);
        } catch (error) {
            console.error("Upload URL test failed:", error);
        }
    }


    return (
        <div>
            <nav className={styles.nav}>
                <Link href="/">
                    <Image
                        width={270}
                        height={80}
                        src="/ytlogo.svg"
                        alt="YouTube Logo"
                    />
                </Link>

                <SignIn user={user} />
                {user && (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                            onChange={handleVideoUpload}
                        />

                        <p>{uploadStatus}</p>
                    </div>
                )}
            </nav>
        </div>
    );
}