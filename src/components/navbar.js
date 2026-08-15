import Link from 'next/link'

export default function Navbar(){
    return(
        <nav>
            <Link href={"/"}>Home</Link>
            <Link href={"/location"}>Location</Link>
            <Link href={"/order"}>Order</Link>
            <Link href={"/about"}>About Us</Link>
        </nav>
    );
}