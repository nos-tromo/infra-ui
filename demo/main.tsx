import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Badge,
  Banner,
  Button,
  CopyButton,
  Card,
  FileList,
  ForceGraph,
  type ForceGraphEdge,
  type ForceGraphNode,
  Input,
  Select,
  Spinner,
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
  const [demoFiles, setDemoFiles] = useState([
    { name: 'interview_2021_part1.mp4', size: 412_000_000 },
    { name: 'witness_statement_final.pdf', size: 2_100_000 },
    { name: 'photo_evidence_0043.jpg', size: 880_000 },
  ])

  const [graphNodes, setGraphNodes] = useState(INITIAL_GRAPH_NODES)
  const [graphEdges, setGraphEdges] = useState(INITIAL_GRAPH_EDGES)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
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
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-10">
      <h1 className="text-lg font-semibold">@infra/ui kitchen sink</h1>

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
          selectedId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onExpandNode={expandGraphNode}
          expandingId={expandingNodeId}
          statusText={`${graphNodes.length} nodes, ${graphEdges.length} edges`}
        />
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sink />
  </StrictMode>,
)
