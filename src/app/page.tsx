// Temporary home page for Step 1: shows the green RAS header so we can see the brand
// colours and logo working. Step 3 replaces it with a redirect based on the user's role.
export default function Home() {
  return (
    <div>
      <header className="bg-ras-green">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
          <img src="/ras-logo.png" alt="RAS logo" className="h-10 w-auto" />
          <span className="text-lg font-semibold text-white">RAS Safety</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">RAS Safety</h1>
        <p className="mt-2 text-ras-grey">
          Project set up. Login, the safety form and the dashboard arrive in the next steps.
        </p>
      </main>
    </div>
  );
}
