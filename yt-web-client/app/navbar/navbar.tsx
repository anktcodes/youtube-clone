import Image from "next/image";
import styles from "./navbar.module.css";
import Link from "next/link";
export default function Navbar() {
    return(
        <div>
            <nav className={styles.nav}>
                <Link href="/">  
                    <Image width={270} height={80} src="/ytlogo.svg" alt="Youtube Logo" />
                </Link>
            </nav>
        </div>
    )
}