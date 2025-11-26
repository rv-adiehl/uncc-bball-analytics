import "./globals.css";

export const metadata = { title: "Charlotte Basketball – Film Labeler", description: "Possession → Phases → Player Actions labeling UI" };

/**
 * ROOT LAYOUT
 * 
 * Provides the main application shell with:
 * - Responsive header with branding
 * - Mobile-optimized container
 * - Proper semantic HTML structure
 * - Footer with helpful context
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          {/* Header: Responsive branding and workflow description */}
          <header className="header">
            <div className="brand">🏀 Charlotte Basketball • Film Labeler</div>
            <div className="small">Possession → Phase → Group → Player Action</div>
          </header>
          
          {/* Main content area */}
          <main>
            {children}
          </main>
          
          {/* Footer: Explains data persistence and usage */}
          <footer>Built for manual charting. No frame rate required. Data persists in your browser.</footer>
        </div>
      </body>
    </html>
  );
}
