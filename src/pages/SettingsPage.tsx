import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { Plate } from "@/shared/ui/Plate";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-ground">
      <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-8 sm:py-12">
        <header>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Settings</h1>
          <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-ink-2">
            What you can change. Your colour and your number are not on this
            list — those were assigned, and they stay.
          </p>
        </header>

        <Plate className="mt-8 p-6 sm:p-7">
          <h2 className="font-mono text-micro font-medium tracking-[0.16em] text-ink-3 uppercase">
            Lighting
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[38ch] text-sm leading-relaxed text-ink-2">
              Daylight hangs the collection on a bone wall. Night puts it
              behind vitrine glass. This follows your system until you choose.
            </p>
            <ThemeToggle />
          </div>
        </Plate>

        <Plate className="mt-5 p-6 sm:p-7">
          <ChangePasswordForm />
        </Plate>
      </div>
    </div>
  );
}
