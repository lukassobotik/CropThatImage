"use client";
import styles from "@/app/navbar.module.css";
import Image from "next/image";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";

export default function Navbar() {
    const router = useRouter();
    const path = usePathname();

    const handleLogoClick = () => {
        if (path !== "/") {
            router.push("/");
        } else {
            location.reload();
        }
    }

    return (
        <nav className={styles.navbar}>
            <Image src="/logo-240px.png" alt="CropThatImage" width={50} height={50} className={styles.navbar_logo} onClick={handleLogoClick}/>
            <div className={styles.navbar_content}>
                <div className={styles.navbar_links}>
                    <Link href="/" onClick={handleLogoClick}>Home</Link>
                    <Link href="https://lukassobotik.dev/project/CropThatImage">About</Link>
                    <Link href="https://github.com/lukassobotik/CropThatImage/issues/new">Found an Issue?</Link>
                </div>
                <div className={styles.navbar_socials}>
                    <Link href="https://github.com/lukassobotik/CropThatImage">Github</Link>
                    <Link href="https://buymeacoffee.com/lukassobotik">Support Me</Link>
                </div>
            </div>
        </nav>
    );
}