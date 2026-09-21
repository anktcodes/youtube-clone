'use client';

import Image from "next/image";
import styles from "./navbar.module.css";
import Link from "next/link";
import SignIn from "./sign-in";

import {onAuthStateChangedHelper} from "../firebase/firebase";
import {useState, useEffect} from "react";
import { User } from "firebase/auth/web-extension";


export default function Navbar() { 
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper((user) => {
            setUser(user);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    });


    return(
        <div>
            <nav className={styles.nav}>
                <Link href="/">  
                    <Image width={270} height={80} src="/ytlogo.svg" alt="Youtube Logo" />
                </Link>
                <SignIn user={user} />
            </nav>
        </div>
    )
}