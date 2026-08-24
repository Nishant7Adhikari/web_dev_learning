'use client'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "./navbar.module.css"
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Link from "next/link";
export default function Navbar() {
    const [isOn, setIsOn] = useState(false)

    const handleSidebar = () => {
        setIsOn((previous) => !previous)
    }
    return (
        <aside>
            <div className={style.topBar}>
                <Link href="/" target="newTab">
                    <img
                        className={style.image}
                        src="/media/icon-512x512.png"
                        alt="website's logo"
                    />
                </Link>
                <h1 className={style.textShine}>Nishant</h1>
                <FontAwesomeIcon icon={faBars} className={style.menu} onClick={handleSidebar} />
            </div>
            <nav className={isOn ? style.sideBar : style.sideBarClose }>
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/faqs">FAQs</Link>
            </nav>
        </aside>
    );
}