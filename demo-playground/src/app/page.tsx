export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-github-fg-default">
          Paired Comments Demo Playground
        </h1>
        <p className="text-xl text-github-fg-muted mb-8">
          v2.1.6 - Interactive Demo Environment
        </p>
        <div className="bg-github-canvas-subtle border border-github-border-default rounded-lg p-6 max-w-2xl">
          <p className="text-github-fg-subtle">
            🎉 Docker container is running successfully!
          </p>
          <p className="text-github-fg-subtle mt-4">
            Next steps: Building the GitHub UI and Monaco Editor integration...
          </p>
        </div>
      </div>
    </main>
  );
}
