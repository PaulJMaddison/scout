import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button, Card } from '@/components/ui/primitives'
import { executiveStorySteps } from '@/features/demo/executive-demo-data'

export function ExecutiveStoryFooter({
  currentPath,
}: {
  currentPath: (typeof executiveStorySteps)[number]['to']
}) {
  const currentIndex = executiveStorySteps.findIndex((step) => step.to === currentPath)
  const previous = currentIndex > 0 ? executiveStorySteps[currentIndex - 1] : null
  const next =
    currentIndex >= 0 && currentIndex < executiveStorySteps.length - 1
      ? executiveStorySteps[currentIndex + 1]
      : null

  return (
    <Card className="bg-[linear-gradient(135deg,rgba(248,241,231,0.94),rgba(255,253,248,0.98))]">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
        <div className="grid gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">
              Guided walkthrough
            </p>
            <p className="mt-2 text-sm leading-7 text-ink-700">
              Step through the legacy data story, the semantic lift, and one grounded sales support consumer in sequence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {previous ? (
              <Link to={previous.to}>
                <Button variant="secondary">
                  <ArrowLeft className="size-4" />
                  {previous.label}
                </Button>
              </Link>
            ) : null}
            {next ? (
              <Link to={next.to}>
                <Button>
                  {next.label}
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-[24px] border border-ink-900/8 bg-white/72 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-700">
            Paid enterprise options
          </p>
          <p className="mt-2 text-sm leading-7 text-ink-700">
            Open-source core, plus paid options for future managed control-plane work, private cloud, on-prem deployment, connector work, and enterprise support.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-ink-950">
            <a
              href="mailto:paul.maddison.delimeg@gmail.com"
              className="font-semibold underline decoration-copper-300 underline-offset-4"
            >
              paul.maddison.delimeg@gmail.com
            </a>
            <a
              href="tel:+447742031553"
              className="font-semibold underline decoration-copper-300 underline-offset-4"
            >
              +44 7742 031553
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}
