import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge, Banner, Button, Card, Input, Select, Spinner } from '../src/index'
import './styles.css'

function Sink() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-10">
      <h1 className="text-lg font-semibold">@infra/ui kitchen sink</h1>

      <section className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Disabled</Button>
        <Spinner />
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Badge>neutral</Badge>
        <Badge variant="accent">accent</Badge>
        <Badge variant="danger">danger</Badge>
      </section>

      <Card>
        <div className="flex flex-col gap-3">
          <Input placeholder="Text input" />
          <Select defaultValue="a">
            <option value="a">Option A</option>
            <option value="b">Option B</option>
          </Select>
        </div>
      </Card>

      <Banner>Informational banner</Banner>
      <Banner variant="danger">Something went wrong</Banner>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sink />
  </StrictMode>,
)
