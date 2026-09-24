import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Anatomi 101",
  title: { default: "Anatomi 101 | Türkçe–Latince Anatomi Öğren", template: "%s | Anatomi 101" },
  description: "Türkçe ve Latince anatomi terimlerini ayrıntılı sistem menüleri, günlük sorular ve quizlerle öğren.",
  keywords: ["anatomi", "Latince anatomi", "tıp eğitimi", "anatomi quiz", "Terminologia Anatomica"],
  category: "education",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Anatomi 101",
    title: "Anatomi 101",
    description: "Türkçe–Latince interaktif anatomi öğrenme uygulaması.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#111b18" },
  ],
};

const themeScript = `(function(){try{var p=new URLSearchParams(location.search);var t=p.get('theme')||(localStorage.getItem('anatomy101:theme')==='dark'?'dark':'light');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
