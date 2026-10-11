"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <>
      <h1>Something went wrong</h1>
      <p className="muted">
        The store could not be loaded. Check that <code>QUEEK_SECRET_KEY</code>{" "}
        in <code>.env</code> is a valid dev store key, then try again. The
        server log has the details.
      </p>
      <button className="btn" type="button" onClick={reset}>
        Try again
      </button>
    </>
  );
}
