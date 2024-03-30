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
            <div className={styles.navbar_link}>

            </div>
        </nav>
    );
}