import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  AppShell,
  Badge,
  Banner,
  Button,
  CopyButton,
  Card,
  CycleButton,
  FileList,
  DeleteButton,
  DocumentsIcon,
  DownloadButton,
  ForceGraph,
  ImageIcon,
  type ForceGraphEdge,
  type ForceGraphNode,
  Input,
  LayersIcon,
  Menu,
  MenuItem,
  PageHeader,
  Select,
  SelectMenu,
  SidebarGroup,
  Spinner,
  ToggleButton,
} from '../src/index'
import './styles.css'

const GRAPH_NODE_STYLES = {
  seed: { color: '#f97316' },
  person: { color: '#7c3aed' },
  topic: { color: '#4ade80' },
}

const GRAPH_EDGE_STYLES = {
  mentions: {},
  discusses: {},
  related: { dashed: true },
}

const GRAPH_LEGEND = [
  { kind: 'seed', label: 'Seed' },
  { kind: 'person', label: 'Person' },
  { kind: 'topic', label: 'Topic' },
]

const DEMO_PICKS = [
  { value: 'a', label: 'Case Alpha (2)' },
  { value: 'b', label: 'Case Beta (0)' },
  { value: 'c', label: 'Retired case', disabled: true },
]

/* Ungrouped first, then a heading per owner — the shape a collection list
   arrives in. Type `ü` with the panel open to exercise the type-ahead. */
const DEMO_COLLECTIONS = [
  { value: 'own:transcripts', label: 'transcripts' },
  { value: 'own:uebergabe', label: 'Übergabe' },
  { value: 'a:field-notes', label: 'field-notes', group: 'a.beispiel' },
  { value: 'a:archive', label: 'archive', group: 'a.beispiel' },
  { value: 'j:intake', label: 'intake', group: 'j.muster' },
]

const INITIAL_GRAPH_NODES: ForceGraphNode[] = [
  { id: 'n1', label: 'Origin Alpha', kind: 'seed' },
  { id: 'n2', label: 'Contact Bravo', kind: 'person' },
  { id: 'n3', label: 'Contact Charlie', kind: 'person' },
  { id: 'n4', label: 'Contact Delta', kind: 'person' },
  { id: 'n5', label: 'Contact Echo', kind: 'person' },
  { id: 'n6', label: 'Topic Foxtrot', kind: 'topic' },
  { id: 'n7', label: 'Topic Golf', kind: 'topic' },
  { id: 'n8', label: 'Topic Hotel', kind: 'topic' },
]

const INITIAL_GRAPH_EDGES: ForceGraphEdge[] = [
  { source: 'n1', target: 'n2', kind: 'mentions', directed: true },
  { source: 'n1', target: 'n3', kind: 'mentions', directed: true },
  { source: 'n2', target: 'n6', kind: 'discusses', directed: true },
  { source: 'n3', target: 'n7', kind: 'discusses' },
  { source: 'n4', target: 'n8', kind: 'discusses' },
  { source: 'n2', target: 'n4', kind: 'related' },
]

function Sink() {
  const [picked, setPicked] = useState<string | null>('a')
  const [collection, setCollection] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [options, setOptions] = useState<Record<string, boolean>>({ speakers: true })
  const [target, setTarget] = useState<'all' | 'documents' | 'visual'>('all')
  const [demoFiles, setDemoFiles] = useState([
    { name: 'interview_2021_part1.mp4', size: 412_000_000 },
    { name: 'witness_statement_final.pdf', size: 2_100_000 },
    { name: 'photo_evidence_0043.jpg', size: 880_000 },
  ])

  const [graphNodes, setGraphNodes] = useState(INITIAL_GRAPH_NODES)
  const [graphEdges, setGraphEdges] = useState(INITIAL_GRAPH_EDGES)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null)

  const expandGraphNode = (id: string) => {
    setExpandingNodeId(id)
    const suffix = Math.random().toString(36).slice(2, 6)
    const newNodes: ForceGraphNode[] = [
      { id: `${id}-${suffix}-1`, label: `Related ${suffix}-1`, kind: 'person' },
      { id: `${id}-${suffix}-2`, label: `Related ${suffix}-2`, kind: 'topic' },
    ]
    const newEdges: ForceGraphEdge[] = [
      { source: id, target: newNodes[0].id, kind: 'mentions', directed: true },
      { source: id, target: newNodes[1].id, kind: 'discusses' },
    ]
    setGraphNodes((ns) => [...ns, ...newNodes])
    setGraphEdges((es) => [...es, ...newEdges])
    setExpandingNodeId(null)
  }

  return (
    <AppShell
      title="kitchen-sink"
      version="v0.9.0"
      user="jane.doe"
      sidebar={
        <SidebarGroup label="Sections">
          <a
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            href="#primitives"
          >
            Primitives
          </a>
        </SidebarGroup>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <PageHeader title="Primitives" caption="Every exported component, both themes" />

        <div id="primitives" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card title="Documents" interactive>
            1,284
          </Card>
          <Card title="Chunks">48,102</Card>
        </div>

        <section className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <CopyButton text="Copied from the kitchen sink" />
          <Spinner />
        </section>

        {/* A form's option row: stretched across the span, lit where chosen. */}
        <section className="flex flex-wrap gap-2">
          {['Speakers', 'Word analysis', 'Summary', 'Hate speech', 'Keyframes'].map((label) => {
            const key = label.toLowerCase().split(' ')[0]
            return (
              <ToggleButton
                key={key}
                pressed={Boolean(options[key])}
                onClick={() => setOptions((o) => ({ ...o, [key]: !o[key] }))}
                className="min-w-32 flex-1"
              >
                {label}
              </ToggleButton>
            )
          })}
        </section>

        {/* One setting, three values, one 32px button — the row of icon
            controls a chat header carries. */}
        <section className="flex flex-wrap items-center gap-3">
          <h2 className="w-full text-sm font-medium text-muted-foreground">Cycle button</h2>
          <CycleButton
            name="Answer from"
            options={[
              { value: 'all', icon: <LayersIcon />, label: 'Everything' },
              { value: 'documents', icon: <DocumentsIcon />, label: 'Documents' },
              { value: 'visual', icon: <ImageIcon />, label: 'Images' },
            ]}
            value={target}
            onChange={setTarget}
          />
          <span className="text-sm text-muted-foreground">{target}</span>
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
            <SelectMenu
              label="Demo picker"
              options={DEMO_PICKS}
              value={picked}
              onChange={setPicked}
              placeholder="Choose one…"
            />
            {/* Title-sized: the only way to eyeball the bug this replaces — a
                native select at this size opens a popup that covers the row. */}
            <SelectMenu
              label="Demo picker, title-sized"
              options={DEMO_PICKS}
              value={picked}
              onChange={setPicked}
              placeholder="Choose one…"
              triggerClassName="text-2xl font-semibold"
            />
            {/* Field-shaped: the box above it is an Input, and the point is
                that you cannot tell them apart until one opens. */}
            <SelectMenu
              variant="field"
              label="Demo picker, field-shaped"
              options={DEMO_PICKS}
              value={picked}
              onChange={setPicked}
              placeholder="Choose one…"
            />
            <SelectMenu
              variant="field"
              label="Collection"
              options={DEMO_COLLECTIONS}
              value={collection}
              onChange={setCollection}
              placeholder="Choose a collection…"
            />
          </div>
        </Card>

        <section className="flex flex-wrap items-center gap-3">
          <h2 className="w-full text-sm font-medium text-muted-foreground">Menus</h2>
          <Menu trigger={(p) => <DownloadButton {...p} label="Export" className="gap-1 px-2" />}>
            <MenuItem onSelect={() => window.alert('Exported')}>Combined JSONL</MenuItem>
            <MenuItem href="#" download="report.csv">
              CSV
            </MenuItem>
            <MenuItem href="#" target="_blank" rel="noreferrer">
              HTML (new tab)
            </MenuItem>
          </Menu>

          {/* The second step lives inside the same panel: a confirmation that
              opens a dialog loses the row it was asked about. */}
          <Menu
            align="end"
            trigger={(p) => <DeleteButton {...p} label="Clear jobs" className="gap-1 px-2" />}
            onOpenChange={(open) => !open && setConfirming(false)}
          >
            {({ close }) =>
              confirming ? (
                <div className="px-3 py-2">
                  <p className="max-w-[16rem] text-sm text-foreground">Clear all 4 jobs?</p>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="danger" onClick={close}>
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <MenuItem disabled hint="No finished jobs yet" onSelect={() => {}}>
                    Clear finished (0)
                  </MenuItem>
                  <MenuItem
                    tone="danger"
                    closeOnSelect={false}
                    onSelect={() => setConfirming(true)}
                  >
                    Clear all (4)
                  </MenuItem>
                </>
              )
            }
          </Menu>
        </section>

        <Banner>Informational banner</Banner>
        <Banner variant="danger">Something went wrong</Banner>

        <FileList
          files={demoFiles}
          onRemove={(i) => setDemoFiles((fs) => fs.filter((_, j) => j !== i))}
          onClear={() => setDemoFiles([])}
        />

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Force graph</h2>
          <ForceGraph
            nodes={graphNodes}
            edges={graphEdges}
            nodeStyles={GRAPH_NODE_STYLES}
            edgeStyles={GRAPH_EDGE_STYLES}
            legend={GRAPH_LEGEND}
            selectedIds={selectedNodeIds}
            onSelectionChange={setSelectedNodeIds}
            onExpandNode={expandGraphNode}
            onDeleteNodes={(ids) => {
              const removed = new Set(ids)
              setGraphNodes((ns) => ns.filter((n) => !removed.has(n.id)))
              setGraphEdges((es) =>
                es.filter((e) => !removed.has(e.source) && !removed.has(e.target)),
              )
              setSelectedNodeIds((prev) => prev.filter((id) => !removed.has(id)))
            }}
            expandingId={expandingNodeId}
            statusText={`${graphNodes.length} nodes, ${graphEdges.length} edges`}
          />
        </section>
      </div>
    </AppShell>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sink />
  </StrictMode>,
)
