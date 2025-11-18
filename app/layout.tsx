import "./globals.css";

export const metadata = { title: "Charlotte Basketball – Film Labeler", description: "Possession → Phases → Player Actions labeling UI" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="header">
            <div className="brand">🏀 Charlotte Basketball • Film Labeler</div>
            <div className="small">Possession → Phase → Group → Player Action</div>
          </div>
          {children}
          <footer>Built for manual charting. No frame rate required. Data persists in your browser.</footer>
        </div>
      </body>
    </html>
  );
}
