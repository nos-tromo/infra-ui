import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ActionBar,
  AppShell,
  AttachmentTile,
  Badge,
  Banner,
  AttachButton,
  Button,
  ChatComposer,
  CopyButton,
  Card,
  ContextMeter,
  CycleButton,
  FileList,
  DeleteButton,
  DocumentsIcon,
  DownloadButton,
  EmptyState,
  ForceGraph,
  ImageIcon,
  ImageLightbox,
  type AttachmentKind,
  type AttachmentTileStatus,
  type ForceGraphEdge,
  type ForceGraphNode,
  Input,
  LayersIcon,
  Menu,
  MenuItem,
  NewButton,
  PageHeader,
  PURPOSE_HEADER,
  PURPOSE_REQUIRED_STATUS,
  PurposeBar,
  SectionHeader,
  Select,
  SelectMenu,
  SidebarGroup,
  Spinner,
  SendButton,
  StopButton,
  ToggleButton,
  UndoButton,
  UserBubble,
  withPurpose,
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

/* Pictures for the attachment tiles, drawn inline: the demo fetches nothing, as
   the library never does. In an app these are object URLs the app makes. */
const drawn = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`

const PICTURE_HARBOUR = drawn(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
    '<rect width="120" height="120" fill="#bcd6ee"/>' +
    '<circle cx="86" cy="34" r="14" fill="#f6c453"/>' +
    '<path d="M0 78 L28 50 L52 74 L78 44 L120 80 V120 H0Z" fill="#6b8caf"/>' +
    '<rect y="82" width="120" height="38" fill="#2f5f8a"/>' +
    '<path d="M10 96 H46 M60 104 H104 M20 112 H70" stroke="#9fc3e3" stroke-width="3"/>' +
    '</svg>',
)
const PICTURE_FLOORPLAN = drawn(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
    '<rect width="120" height="120" fill="#f1ecdf"/>' +
    '<path d="M14 14 H106 V106 H14Z M14 56 H60 M60 14 V80 M60 80 H106 M84 80 V106" ' +
    'fill="none" stroke="#5a5348" stroke-width="4"/>' +
    '</svg>',
)
const PICTURE_CHART = drawn(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
    '<rect width="120" height="120" fill="#e9f0e4"/>' +
    '<rect x="16" y="70" width="18" height="34" fill="#5f8f5a"/>' +
    '<rect x="42" y="46" width="18" height="58" fill="#5f8f5a"/>' +
    '<rect x="68" y="58" width="18" height="46" fill="#5f8f5a"/>' +
    '<rect x="94" y="24" width="14" height="80" fill="#3d6b39"/>' +
    '</svg>',
)

interface DemoTile {
  id: string
  name: string
  kind: AttachmentKind
  status: AttachmentTileStatus
  thumbnailUrl?: string
  detail?: string
  warning?: string
  statusLabel?: string
}

/* One of each status and each kind. A tile is openable only once it is ready. */
const INITIAL_TILES: DemoTile[] = [
  {
    id: 't1',
    name: 'harbour-sketch.png',
    kind: 'image',
    status: 'ready',
    thumbnailUrl: PICTURE_HARBOUR,
  },
  {
    id: 't2',
    name: 'floor-plan.png',
    kind: 'image',
    status: 'uploading',
    thumbnailUrl: PICTURE_FLOORPLAN,
  },
  {
    id: 't3',
    name: 'sales-chart.png',
    kind: 'image',
    status: 'processing',
    thumbnailUrl: PICTURE_CHART,
  },
  {
    id: 't4',
    name: 'scan-0042.png',
    kind: 'image',
    status: 'failed',
    thumbnailUrl: PICTURE_FLOORPLAN,
    statusLabel: 'Could not be read',
  },
  { id: 't5', name: 'old-photo.png', kind: 'image', status: 'expired' },
  { id: 't6', name: 'quarterly-plan.pdf', kind: 'document', status: 'ready', detail: '24 slides' },
  { id: 't7', name: 'site-walk.mp4', kind: 'video', status: 'ready', detail: '01:12' },
  { id: 't8', name: 'standup-notes.m4a', kind: 'audio', status: 'processing', detail: '04:30' },
  {
    id: 't9',
    name: 'minutes-of-the-planning-meeting-final-v2.docx',
    kind: 'document',
    status: 'failed',
    detail: '2.4 MB',
  },
  { id: 't10', name: 'budget-draft.xlsx', kind: 'document', status: 'expired', detail: '88 KB' },
  {
    id: 't11',
    name: 'field-survey.pdf',
    kind: 'document',
    status: 'ready',
    detail: '18.6 MB',
    warning: 'Very long: read only in parts',
  },
  {
    id: 't12',
    name: 'site-map.png',
    kind: 'image',
    status: 'ready',
    thumbnailUrl: PICTURE_FLOORPLAN,
    warning: 'Sent at a reduced size',
  },
]

function Sink() {
  const [picked, setPicked] = useState<string | null>('a')
  const [collection, setCollection] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [options, setOptions] = useState<Record<string, boolean>>({ speakers: true })
  const [target, setTarget] = useState<'all' | 'documents' | 'visual'>('all')
  const [purposeRequired, setPurposeRequired] = useState(true)
  const [auditedOutcome, setAuditedOutcome] = useState('')
  const [chatDraft, setChatDraft] = useState('')
  const [tiles, setTiles] = useState(INITIAL_TILES)
  const [openedTile, setOpenedTile] = useState('')
  // The picture at full view: a ready image tile's `onOpen` sets it and the
  // lightbox's `onClose` clears it. `src` is what the app owns; here, a data URL.
  const [lightbox, setLightbox] = useState<{ name: string; src: string } | null>(null)
  const openTile = (tile: DemoTile) => {
    if (tile.kind === 'image' && tile.thumbnailUrl) {
      setLightbox({ name: tile.name, src: tile.thumbnailUrl })
    } else {
      setOpenedTile(tile.name) // nothing to see at full view: only the line below changes
    }
  }
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
      headerActions={<PurposeBar scope="kitchen-sink" required={purposeRequired} />}
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

        {/* A chat's foot: what the user wrote in the accent bubble, the answer
            as plain text, and the message box as one pill below them. */}
        <section className="flex max-w-3xl flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Chat</h2>
          <UserBubble>
            Summarise the minutes of the planning meeting.
            {/* md tiles in a message: pictures first, openable and not. */}
            <div className="flex flex-wrap gap-2">
              <AttachmentTile
                name="harbour-sketch.png"
                kind="image"
                status="ready"
                thumbnailUrl={PICTURE_HARBOUR}
                size="md"
                onOpen={() => setLightbox({ name: 'harbour-sketch.png', src: PICTURE_HARBOUR })}
              />
              <AttachmentTile
                name="floor-plan.png"
                kind="image"
                status="ready"
                thumbnailUrl={PICTURE_FLOORPLAN}
                size="md"
                onOpen={() => setLightbox({ name: 'floor-plan.png', src: PICTURE_FLOORPLAN })}
              />
              <AttachmentTile name="old-photo.png" kind="image" status="expired" size="md" />
            </div>
          </UserBubble>
          <p className="text-sm">The meeting agreed on three dates and left the budget open.</p>
          {/* sm tiles above the pill, never inside it: the pill rounds every
              button in it. Remove takes a tile out of this demo list. */}
          <div className="flex flex-wrap gap-3 pt-2">
            {tiles.map((tile) => (
              <AttachmentTile
                key={tile.id}
                name={tile.name}
                kind={tile.kind}
                status={tile.status}
                thumbnailUrl={tile.thumbnailUrl}
                detail={tile.detail}
                warning={tile.warning}
                statusLabel={tile.statusLabel}
                onOpen={tile.status === 'ready' ? () => openTile(tile) : undefined}
                onRemove={() => setTiles((list) => list.filter((t) => t.id !== tile.id))}
              />
            ))}
            {tiles.length === 0 && (
              <Button variant="secondary" onClick={() => setTiles(INITIAL_TILES)}>
                Restore the tiles
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {openedTile ? `Opened ${openedTile}` : 'Nothing opened'}
          </p>
          {/* The context ring at four fills: the app words the number in `label`,
              the ring draws it. 1.4 is an estimate over its budget. */}
          <div className="flex items-center gap-3">
            {[0.12, 0.62, 0.8, 1.4].map((fill) => (
              <ContextMeter
                key={fill}
                value={fill}
                label={`about ${Math.round(Math.min(1, fill) * 100)} % of the context used`}
              />
            ))}
          </div>
          {/* Portalled to the body: it sits here only for its state. The pictures
              are drawn SVG, so the saved file is named for what it holds. */}
          <ImageLightbox
            open={lightbox !== null}
            src={lightbox?.src ?? ''}
            alt={lightbox?.name ?? ''}
            closeLabel="Close"
            downloadHref={lightbox?.src}
            downloadName={lightbox?.name.replace(/\.[^.]+$/, '.svg')}
            onClose={() => setLightbox(null)}
          />
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setChatDraft('')
            }}
          >
            <ChatComposer
              aria-label="Write a message"
              placeholder="Write a message"
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              start={<AttachButton label="Attach files" />}
              end={
                <>
                  <ContextMeter
                    value={chatDraft.length / 200}
                    label={`about ${Math.round(Math.min(1, chatDraft.length / 200) * 100)} % of the context used`}
                  />
                  <SendButton
                    type="submit"
                    variant="primary"
                    label="Send"
                    disabled={!chatDraft.trim()}
                  />
                </>
              }
            />
          </form>
        </section>

        {/* A stand-in backend that answers 428 until a purpose is stated:
            withPurpose asks through the bar in the header, then sends again. */}
        <section className="flex flex-wrap items-center gap-3">
          <h2 className="w-full text-sm font-medium text-muted-foreground">Purpose</h2>
          <Button
            variant="secondary"
            onClick={async () => {
              const response = await withPurpose('kitchen-sink', async (headers) => ({
                status: headers[PURPOSE_HEADER] ? 200 : PURPOSE_REQUIRED_STATUS,
              }))
              setAuditedOutcome(
                response.status === 200 ? 'Sent with a purpose' : 'Refused: no purpose stated',
              )
            }}
          >
            Run an audited search
          </Button>
          <ToggleButton pressed={purposeRequired} onClick={() => setPurposeRequired((v) => !v)}>
            Required
          </ToggleButton>
          <span className="text-sm text-muted-foreground">{auditedOutcome}</span>
        </section>

        {/* Where actions go: quiet icons in the header row, commit actions in a
            full-width bar at the foot, a labelled create action only while empty. */}
        <section className="grid gap-4 lg:grid-cols-2">
          <h2 className="text-sm font-medium text-muted-foreground lg:col-span-2">
            Action placement
          </h2>
          <Card
            title="Merge topics"
            caption="Draws similar topics together into fewer, broader ones."
            actions={
              <>
                <NewButton label="New topic" />
                <UndoButton label="Restore the original topics" />
                <StopButton label="Abort" />
              </>
            }
          >
            <p className="mb-4 text-sm text-muted-foreground">12 topics, 2 selected.</p>
            <SectionHeader
              level={3}
              title="Unassigned chunks"
              caption="Places each chunk with its nearest topic when it is at least this similar."
              actions={<UndoButton label="Undo placement" />}
              className="mb-2"
            />
            <ActionBar>
              <Button variant="secondary">Discard</Button>
              <Button>Apply</Button>
            </ActionBar>
          </Card>
          <Card title="Data extracts" caption="Full transcripts and document texts as files">
            <EmptyState action={<Button>Build extract</Button>}>No extracts yet.</EmptyState>
          </Card>
          <Card title="Long labels" className="lg:col-span-2">
            <ActionBar>
              <Button variant="secondary">Ursprüngliche Themen wiederherstellen</Button>
              <Button>Übernehmen</Button>
            </ActionBar>
          </Card>
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
