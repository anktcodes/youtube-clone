'use client';

import Image from "next/image";
import styles from "./navbar.module.css";
import Link from "next/link";
import SignIn from "./sign-in";

import { onAuthStateChangedHelper } from "../firebase/firebase";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

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
            </nav>
        </div>
    );
}