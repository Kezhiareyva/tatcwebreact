export const metadata = { title: 'TATC Web API', robots: { index: false, follow: false } };

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
