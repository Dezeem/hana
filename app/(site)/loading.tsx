export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-[1440px] animate-pulse px-5 pt-14 sm:px-8 sm:pt-20">
      <div className="h-px w-24 bg-line" />
      <div className="mt-8 h-12 w-2/3 max-w-lg bg-mist" />
      <div className="mt-4 h-12 w-1/2 max-w-sm bg-mist" />
      <div className="mt-10 h-3 w-full max-w-md bg-mist" />
      <div className="mt-3 h-3 w-2/3 max-w-sm bg-mist" />

      <div className="mt-20 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index}>
            <div
              className="w-full bg-mist"
              style={{ aspectRatio: index % 3 === 0 ? "0.72" : index % 3 === 1 ? "0.9" : "0.66" }}
            />
            <div className="mt-3 h-3 w-4/5 bg-mist" />
            <div className="mt-2 h-2 w-1/2 bg-mist-soft" />
          </div>
        ))}
      </div>
    </div>
  );
}
