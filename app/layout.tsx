import type { Metadata } from "next";
import { Fraunces, Newsreader, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./providers/ToastProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { MeshBackground } from "./components/MeshBackground";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Strattigo — Your AI Study Partner",
  description:
    "Upload your course materials and let Strattigo generate study guides, quizzes, study plans, and answer your questions — all powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(fraunces.variable, newsreader.variable, outfit.variable, jetbrainsMono.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col" style={{ color: "var(--text-primary)" }}>
        <MeshBackground />
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
