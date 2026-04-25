import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnQuest — AI-Powered Learning Companion",
  description: "Master any topic with personalized AI-guided lessons, interactive quizzes, and gamified progress tracking. Learn at your own pace with Gemini-powered intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                const d = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches);
                if (d) document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
