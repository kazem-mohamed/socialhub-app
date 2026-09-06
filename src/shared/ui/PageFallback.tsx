import { StateMessage } from "./StateMessage";

/** Shown while a lazily-loaded route chunk is downloading. */
export function PageFallback() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-7 sm:px-10">
      <StateMessage>Loading</StateMessage>
    </div>
  );
}
