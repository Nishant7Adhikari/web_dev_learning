import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Viewport configuration (theme color, etc.)
export const viewport = {
  themeColor: "#8a2be2",
};

// Replaces lines 14-17
export const metadata = {
  title: "Nishant Adhikari - Student & Web Developer",
  description:
    "Nishant Adhikari – Student & Web Developer from Kathmandu, Nepal.",
  authors: [{ name: "Nishant Adhikari" }],
  keywords: [
    "Nishant Adhikari",
    "web developer Nepal",
    "student portfolio",
    "JavaScript projects",
    "HTML CSS",
    "PWA developer",
    "AI tools",
    "Nishant Web Development",
    "Kathmandu programmer",
  ],
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
  },
  alternates: {
    canonical: "https://nishantadhikari.info.np/",
  },
  openGraph: {
    title: "Nishant Adhikari - Student & Web Developer",
    description:
      "Nishant Adhikari - Student & Web Developer",
    siteName: "Nishant Adhikari",
    locale: "en_US",
    url: "https://nishantadhikari.info.np",
    type: "website",
    images: [
      {
        url: "https://nishantadhikari.info.np/media/icon-512x512.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nishant Adhikari - Student & Web Developer",
    description:
      "Nishant Adhikari - Student & Web Developer Portfolio | Showcasing innovative web development projects including Progressive Web Apps, AI-powered tools, and interactive applications.",
    creator: "@Nishant_OP11",
    site: "@Nishant_OP11",
    images: ["https://nishantadhikari.info.np/media/icon-512x512.png"],
  },
};

export default function RootLayout({ children }) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Nishant Adhikari",
      "url": "https://nishantadhikari.info.np",
      "sameAs": [
        "https://github.com/Nishant7Adhikari",
        "https://x.com/Nishant_OP11",
        "https://www.instagram.com/nishant060211",
        "https://www.facebook.com/share/172n6tfVsX/",
      ],
      "jobTitle": "Web Developer",
      "description":
        "Student and web developer from Kathmandu, Nepal, specializing in JavaScript, HTML, CSS, Progressive Web Apps, and modern web technologies. Creator of innovative, user-friendly web applications and educational projects.",
      "knowsAbout": [
        "JavaScript",
        "HTML",
        "CSS",
        "Progressive Web Apps",
        "React",
        "Web Development",
        "UI/UX Design",
        "Frontend Development",
      ],
      "worksFor": {
        "@type": "Organization",
        "name": "Nishant Adhikari",
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Kathmandu",
        "addressCountry": "Nepal",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": "Nishant Adhikari Web Development Portfolio",
      "description":
        "A comprehensive collection of web development projects showcasing skills in JavaScript, HTML, CSS, PWAs, and modern web technologies.",
      "author": {
        "@type": "Person",
        "name": "Nishant Adhikari",
      },
      "dateCreated": "2024",
      "dateModified": "2025",
      "inLanguage": "en",
      "keywords":
        "web development, portfolio, JavaScript, HTML, CSS, PWA, student developer, Kathmandu, Nepal",
    },
  ];

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Navbar />
        {children}

        <Script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" strategy="lazyOnload" />
        <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" strategy="lazyOnload" />
      </body>
    </html>
  );
}