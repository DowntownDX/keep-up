import { useRef, useState, type KeyboardEvent } from "react";

type TabId = "guide" | "data";

export function GuideCard({ onReset }: { onReset: () => void }) {
  const [tab, setTab] = useState<TabId>("guide");
  const [confirming, setConfirming] = useState(false);
  const guideTab = useRef<HTMLButtonElement>(null);
  const dataTab = useRef<HTMLButtonElement>(null);

  function selectTab(next: TabId) {
    setTab(next);
    (next === "guide" ? guideTab : dataTab).current?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(tab === "guide" ? "data" : "guide");
    }
  }

  return (
    <section className="card guide" aria-labelledby="guide-title">
      <h2 id="guide-title" className="guide-title">
        Guide
      </h2>

      <div className="tabs" role="tablist" aria-label="Guide">
        <button
          ref={guideTab}
          id="tab-guide"
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === "guide"}
          aria-controls="panel-guide"
          tabIndex={tab === "guide" ? 0 : -1}
          onKeyDown={onTabKeyDown}
          onClick={() => setTab("guide")}
        >
          How to play
        </button>
        <button
          ref={dataTab}
          id="tab-data"
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === "data"}
          aria-controls="panel-data"
          tabIndex={tab === "data" ? 0 : -1}
          onKeyDown={onTabKeyDown}
          onClick={() => setTab("data")}
        >
          Your data
        </button>
      </div>

      <div
        id="panel-guide"
        role="tabpanel"
        aria-labelledby="tab-guide"
        className="guide-panel"
        hidden={tab !== "guide"}
      >
        <p>
          <strong>Goal.</strong> Ship ten ventures. Building burns Credits and Know-how;
          each shipped venture pays passive Cash forever.
        </p>
        <p>
          <strong>First moves.</strong> Put You on Day job tasks to afford an agent, put
          someone on Learn for Know-how, then assign a worker to Build venture.
        </p>
        <p>
          <strong>Keep up.</strong> New model generations arrive on a clock. Upgrade your
          subscription or Edge falls and every Cash payout shrinks.
        </p>
        <p>
          <strong>While you sleep.</strong> Up to eight hours of work is credited when you
          return, and the summary tells you what the team made.
        </p>
      </div>

      <div
        id="panel-data"
        role="tabpanel"
        aria-labelledby="tab-data"
        className="guide-panel"
        hidden={tab !== "data"}
      >
        <p>Progress saves in this browser only. Clearing site data erases it.</p>
        {confirming ? (
          <div className="reset-confirm" role="alertdialog" aria-label="Confirm reset">
            <p>Reset all progress? This cannot be undone.</p>
            <div className="reset-actions">
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  setConfirming(false);
                  onReset();
                }}
              >
                Yes, reset
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="reset-button"
            onClick={() => setConfirming(true)}
          >
            Reset progress
          </button>
        )}
      </div>
    </section>
  );
}
