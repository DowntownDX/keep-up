import type { Hint } from "./hints";

export function NextMove({ hint }: { hint: Hint }) {
  return (
    <section className="card next-move" aria-labelledby="next-title" data-hint={hint.id}>
      <p className="kicker">Next move</p>
      <h2 id="next-title">{hint.title}</h2>
      <p>{hint.detail}</p>
    </section>
  );
}
