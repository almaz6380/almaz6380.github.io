// Ersatz für die zwei Bausteine, die WELLbooked-Rechtsseiten aus der App
// ziehen. Die Texte selbst kommen unverändert aus dem wellbooked-Repo.

export function LegalPage({ title, lastUpdated, children }) {
  return (
    <>
      <h1>{title}</h1>
      {lastUpdated && <p className="stand">Stand: {lastUpdated}</p>}
      {children}
    </>
  );
}

// Der Einwilligungs-Schalter braucht das Konto auf www.wellbooked.at. Auf
// dieser statischen Kopie gibt es ihn nicht — nur den Weg dorthin.
export function CookieConsentControl() {
  return (
    <p>
      Den Schalter für deine Einwilligung findest du in der WELLbooked-App bzw.
      auf www.wellbooked.at unter „Datenschutz“.
    </p>
  );
}
