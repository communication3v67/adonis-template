import GmbPostsController from '#controllers/gmb_posts_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { router as inertiaRouter } from '@inertiajs/react'
import {
    ActionIcon,
    Button,
    Center,
    Group,
    Input,
    Loader,
    Modal,
    ScrollArea,
    Select,
    Switch,
    Table,
    Title,
    Tooltip,
    useMantineTheme,
} from '@mantine/core'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    LuBriefcase,
    LuCalendar,
    LuCheck,
    LuCopy,
    LuFileText,
    LuGripVertical,
    LuImage,
    LuPencil,
    LuTag,
    LuTrash2,
    LuUser,
    LuX,
} from 'react-icons/lu'

// Définissez les largeurs des colonnes
const columnWidths = {
    status: '15%',
    text: '100%',
    date: '50%',
    image_url: '100%',
    link_url: '100%',
    keyword: '100%',
    client: '100%',
    project_name: '100%',
    location_id: '100%',
    account_id: '100%',
    notion_id: '100%',
}

const columns = [
    {
        key: 'status',
        label: (
            <Tooltip label="Statut">
                <LuFileText />
            </Tooltip>
        ),
    },
    { key: 'text', label: 'Contenu' },
    {
        key: 'date',
        label: (
            <Tooltip label="Date">
                <LuCalendar />
            </Tooltip>
        ),
    },
    {
        key: 'image_url',
        label: (
            <Tooltip label="Image">
                <LuImage />
            </Tooltip>
        ),
    },
    {
        key: 'link_url',
        label: (
            <Tooltip label="Lien">
                <LuFileText />
            </Tooltip>
        ),
    },
    {
        key: 'keyword',
        label: (
            <Tooltip label="Mot-clé">
                <LuTag />
            </Tooltip>
        ),
    },
    {
        key: 'client',
        label: (
            <Tooltip label="Client">
                <LuUser />
            </Tooltip>
        ),
    },
    {
        key: 'project_name',
        label: (
            <Tooltip label="Projet">
                <LuBriefcase />
            </Tooltip>
        ),
    },
    { key: 'location_id', label: 'Location ID' },
    { key: 'account_id', label: 'Account ID' },
    { key: 'notion_id', label: 'Notion ID' },
]

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100]

function SortableTableHeader({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        width: columnWidths[id] || 'auto',
    }

    return (
        <Table.Th ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Group spacing="xs">
                <ActionIcon aria-label="Drag handle" size="xs" style={{ cursor: 'grab' }}>
                    <LuGripVertical size={14} style={{ color: '#ccc' }} />
                </ActionIcon>
                {children}
            </Group>
        </Table.Th>
    )
}

export default function GmbPosts(props: InferPageProps<GmbPostsController, 'index'>) {
    const theme = useMantineTheme()
    const rawData = props.gmb_posts

    const [columnOrder, setColumnOrder] = useState(columns.map((col) => col.key))
    const [filters, setFilters] = useState<{ [key: string]: string }>({})
    const [sortBy, setSortBy] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[2])
    const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE_OPTIONS[2])
    const [useInfiniteScroll, setUseInfiniteScroll] = useState<boolean>(true)
    const [modalPost, setModalPost] = useState<any | null>(null)
    const [editingCell, setEditingCell] = useState<{ id: number; key: string } | null>(null)
    const [cellEditValue, setCellEditValue] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (active.id !== over.id) {
            setColumnOrder((items) => {
                const oldIndex = items.indexOf(active.id)
                const newIndex = items.indexOf(over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const orderedColumns = useMemo(() => {
        return columnOrder.map((key) => columns.find((col) => col.key === key))
    }, [columnOrder])

    const statusOptions = useMemo(
        () =>
            [...new Set(rawData.map(({ status }) => status).filter(Boolean))].map((status) => ({
                value: String(status),
                label: String(status),
            })),
        [rawData]
    )

    const filteredSorted = useMemo(() => {
        let d = [...rawData]
        const globalSearch = (filters._global ?? '').toLowerCase().trim()
        d = d.filter((row) => {
            if (globalSearch !== '') {
                return columns.some((col) =>
                    String(row[col.key] ?? '')
                        .toLowerCase()
                        .includes(globalSearch)
                )
            }
            return columns.every((col) => {
                const filter = filters[col.key]?.trim()
                if (!filter) return true
                const val = row[col.key]
                if (val == null) return false
                if (col.key === 'date') {
                    const dt = DateTime.fromISO(val)
                    const formatted = dt.isValid ? dt.toFormat('dd/MM/yyyy HH:mm') : val
                    return formatted.toLowerCase().includes(filter.toLowerCase())
                }
                return String(val).toLowerCase().includes(filter.toLowerCase())
            })
        })
        if (sortBy) {
            d = d.sort((a, b) => {
                let x = a[sortBy] ?? ''
                let y = b[sortBy] ?? ''
                if (sortBy === 'date') {
                    x = DateTime.fromISO(x).toMillis?.() ?? 0
                    y = DateTime.fromISO(y).toMillis?.() ?? 0
                } else {
                    x = String(x).toLowerCase()
                    y = String(y).toLowerCase()
                }
                if (x < y) return sortDir === 'asc' ? -1 : 1
                if (x > y) return sortDir === 'asc' ? 1 : -1
                return 0
            })
        }
        return d
    }, [filters, sortBy, sortDir, rawData])

    const dataToShow = useInfiniteScroll
        ? filteredSorted.slice(0, visibleCount)
        : filteredSorted.slice(0, pageSize)

    const handleCellEditStart = (id: number, key: string, value: string) => {
        setEditingCell({ id, key })
        setCellEditValue(value || '')
    }

    const handleCellEditSave = (id: number, key: string) => {
        inertiaRouter.put(`/gmb_posts/${id}`, { [key]: cellEditValue })
        setEditingCell(null)
        setCellEditValue('')
    }

    const handleDuplicate = (element: any) => {
        const payload = { ...element }
        delete payload.id
        inertiaRouter.post('/gmb_posts', payload)
    }

    const handleEditModalOpen = (element: any) => setModalPost({ ...element })
    const handleEditModalChange = (k: string, v: string) =>
        setModalPost((old: any) => ({ ...old, [k]: v }))
    const handleSaveModal = () => {
        inertiaRouter.put(`/gmb_posts/${modalPost.id}`, modalPost)
        setModalPost(null)
    }

    const handleDelete = (id: number) => {
        if (confirm('Supprimer cet élément ?')) {
            inertiaRouter.delete(`/gmb_posts/${id}`)
        }
    }

    useEffect(() => {
        if (!useInfiniteScroll) return
        const handle = () => {
            if (!scrollRef.current) return
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
            if (scrollTop + clientHeight >= scrollHeight - 48) {
                if (visibleCount < filteredSorted.length) {
                    setVisibleCount((c) => Math.min(c + pageSize, filteredSorted.length))
                }
            }
        }
        const node = scrollRef.current
        if (node) node.addEventListener('scroll', handle)
        return () => node && node.removeEventListener('scroll', handle)
    }, [filteredSorted.length, pageSize, visibleCount, useInfiniteScroll])

    const handleFilterChange = (key: string, value: string | null) => {
        setFilters((old) => ({ ...old, [key]: value || '' }))
        setVisibleCount(pageSize)
    }

    const handleSort = (key: string) => {
        if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        else {
            setSortBy(key)
            setSortDir('asc')
        }
    }

    const handlePageSizeChange = (v: string | null) => {
        const val = Number(v)
        if (!val || !PAGE_SIZE_OPTIONS.includes(val)) return
        setPageSize(val)
        setVisibleCount(val)
    }

    useEffect(() => {
        setIsLoading(true)
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 600

    if (isLoading) {
        return (
            <Center style={{ width: '100%', height: '100vh' }}>
                <Loader />
            </Center>
        )
    }

    return (
        <>
            <Group h={isMobile ? 60 : 100} justify="space-between" mb="xs" wrap="wrap" gap="xs">
                <Title order={isMobile ? 3 : 1}>Mes projets</Title>
                <Button
                    component="a"
                    href="/gmb_posts/create"
                    variant="filled"
                    size={isMobile ? 'xs' : 'sm'}
                >
                    Ajouter un projet
                </Button>
            </Group>
            <Group align="end" gap={isMobile ? 'xs' : 'md'} mb="md" wrap="wrap">
                <Input
                    placeholder="Recherche globale"
                    value={filters._global || ''}
                    onChange={(e) => handleFilterChange('_global', e.target.value)}
                    size={isMobile ? 'xs' : 'sm'}
                    style={{ minWidth: isMobile ? 120 : 220, flex: 1, maxWidth: 300 }}
                />
                <Select
                    label="Statut"
                    placeholder="Tous"
                    value={filters.status || ''}
                    onChange={(val) => handleFilterChange('status', val)}
                    data={statusOptions}
                    clearable
                    size={isMobile ? 'xs' : 'sm'}
                    style={{ minWidth: 100, maxWidth: 160, flex: 1 }}
                />
                <Select
                    label="Nb/aff."
                    value={pageSize.toString()}
                    onChange={handlePageSizeChange}
                    data={PAGE_SIZE_OPTIONS.map((v) => ({
                        value: v.toString(),
                        label: v.toString(),
                    }))}
                    size={isMobile ? 'xs' : 'sm'}
                    style={{ minWidth: 80, maxWidth: 120, flex: 1 }}
                />
                <Switch
                    label="Scroll infini"
                    checked={useInfiniteScroll}
                    onChange={(e) => setUseInfiniteScroll(e.currentTarget.checked)}
                    size={isMobile ? 'xs' : 'sm'}
                />
            </Group>

            <Modal
                opened={!!modalPost}
                onClose={() => setModalPost(null)}
                title="Modifier la ligne"
                size="md"
                styles={{ body: { padding: theme.spacing.md } }}
                fullScreen={isMobile}
                scrollAreaComponent={ScrollArea.Autosize}
                overlayProps={{
                    blur: 2,
                }}
            >
                {modalPost && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveModal()
                        }}
                    >
                        <Group wrap="wrap" grow gap="xs">
                            {columns.map((col) => (
                                <Input.Wrapper
                                    key={col.key}
                                    label={col.label}
                                    style={{ flex: '1 1 150px' }}
                                >
                                    <Input
                                        value={modalPost[col.key] || ''}
                                        onChange={(e) =>
                                            handleEditModalChange(col.key, e.target.value)
                                        }
                                        type={col.key === 'date' ? 'datetime-local' : 'text'}
                                        required={col.key === 'status' || col.key === 'text'}
                                        size={isMobile ? 'xs' : 'sm'}
                                    />
                                </Input.Wrapper>
                            ))}
                        </Group>
                        <Group mt="md" position="apart" gap="sm">
                            <Button variant="light" onClick={() => setModalPost(null)}>
                                Annuler
                            </Button>
                            <Button type="submit">Enregistrer</Button>
                        </Group>
                    </form>
                )}
            </Modal>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <ScrollArea
                            type="auto"
                            h={isMobile ? 380 : 540}
                            style={{
                                width: 'max-content',
                                minWidth: isMobile ? 350 : '100%',
                            }}
                            viewportRef={scrollRef}
                        >
                            <Table
                                highlightOnHover
                                stickyHeader
                                withTableBorder
                                striped
                                fontSize={isMobile ? 'xs' : 'sm'}
                                horizontalSpacing={isMobile ? 'xs' : 'sm'}
                                verticalSpacing={isMobile ? 'xs' : 'sm'}
                                style={{
                                    width: 'fit-content',
                                    minWidth: '100%',
                                    fontSize: isMobile ? 13 : undefined,
                                }}
                            >
                                <Table.Thead>
                                    <Table.Tr>
                                        {orderedColumns.map((col) => (
                                            <SortableTableHeader key={col.key} id={col.key}>
                                                {col.label}
                                            </SortableTableHeader>
                                        ))}
                                        <Table.Th style={{ width: '120px' }}>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {dataToShow.length > 0 ? (
                                        dataToShow.map((element) => (
                                            <Table.Tr key={element.id}>
                                                {orderedColumns.map((col) => {
                                                    const isEditing =
                                                        editingCell &&
                                                        editingCell.id === element.id &&
                                                        editingCell.key === col.key
                                                    return (
                                                        <Table.Td
                                                            key={col.key}
                                                            className="td-editable"
                                                            style={{
                                                                padding: isMobile
                                                                    ? theme.spacing.xs
                                                                    : undefined,
                                                                width: columnWidths[col.key],
                                                                maxWidth: columnWidths[col.key],
                                                                overflowX: 'auto',
                                                                fontSize: isMobile ? 13 : undefined,
                                                            }}
                                                        >
                                                            {isEditing ? (
                                                                <Group gap="xs" wrap="nowrap">
                                                                    <Input
                                                                        value={cellEditValue}
                                                                        onChange={(e) =>
                                                                            setCellEditValue(
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        size={
                                                                            isMobile ? 'xs' : 'sm'
                                                                        }
                                                                        type={
                                                                            col.key === 'date'
                                                                                ? 'datetime-local'
                                                                                : 'text'
                                                                        }
                                                                        style={{
                                                                            minWidth: 60,
                                                                            maxWidth: 140,
                                                                        }}
                                                                        autoFocus
                                                                    />
                                                                    <ActionIcon
                                                                        color="green"
                                                                        variant="light"
                                                                        size={
                                                                            isMobile ? 'xs' : 'sm'
                                                                        }
                                                                        onClick={() =>
                                                                            handleCellEditSave(
                                                                                element.id,
                                                                                col.key
                                                                            )
                                                                        }
                                                                        aria-label="Save"
                                                                    >
                                                                        <LuCheck
                                                                            size={
                                                                                isMobile ? 12 : 14
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                    <ActionIcon
                                                                        color="red"
                                                                        variant="light"
                                                                        size={
                                                                            isMobile ? 'xs' : 'sm'
                                                                        }
                                                                        onClick={() =>
                                                                            setEditingCell(null)
                                                                        }
                                                                        aria-label="Cancel"
                                                                    >
                                                                        <LuX
                                                                            size={
                                                                                isMobile ? 12 : 14
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </Group>
                                                            ) : (
                                                                <Group
                                                                    gap="xs"
                                                                    wrap="nowrap"
                                                                    justify="space-between"
                                                                >
                                                                    <span
                                                                        style={{
                                                                            maxWidth: 100,
                                                                            overflow: 'hidden',
                                                                            textOverflow:
                                                                                'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            display: 'inline-block',
                                                                        }}
                                                                    >
                                                                        {col.key === 'image_url' ? (
                                                                            element[col.key] ? (
                                                                                <img
                                                                                    src={
                                                                                        element[
                                                                                            col.key
                                                                                        ]
                                                                                    }
                                                                                    alt="Post"
                                                                                    style={{
                                                                                        width: 50,
                                                                                        height: 30,
                                                                                        borderRadius: 4,
                                                                                        objectFit:
                                                                                            'cover',
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <span
                                                                                    style={{
                                                                                        color: '#bbb',
                                                                                    }}
                                                                                >
                                                                                    —
                                                                                </span>
                                                                            )
                                                                        ) : col.key ===
                                                                          'link_url' ? (
                                                                            element[col.key] ? (
                                                                                <a
                                                                                    href={
                                                                                        element[
                                                                                            col.key
                                                                                        ]
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                >
                                                                                    {(() => {
                                                                                        try {
                                                                                            return new URL(
                                                                                                element[
                                                                                                    col.key
                                                                                                ]
                                                                                            )
                                                                                                .hostname
                                                                                        } catch {
                                                                                            return element[
                                                                                                col
                                                                                                    .key
                                                                                            ]
                                                                                        }
                                                                                    })()}
                                                                                </a>
                                                                            ) : (
                                                                                <span
                                                                                    style={{
                                                                                        color: '#bbb',
                                                                                    }}
                                                                                >
                                                                                    —
                                                                                </span>
                                                                            )
                                                                        ) : col.key === 'date' &&
                                                                          element[col.key] ? (
                                                                            DateTime.fromISO(
                                                                                element[col.key]
                                                                            ).isValid ? (
                                                                                DateTime.fromISO(
                                                                                    element[col.key]
                                                                                ).toLocaleString(
                                                                                    DateTime.DATETIME_MED
                                                                                )
                                                                            ) : (
                                                                                element[col.key]
                                                                            )
                                                                        ) : col.key === 'text' &&
                                                                          !!element[col.key] &&
                                                                          element[col.key].length >
                                                                              100 ? (
                                                                            element[col.key].slice(
                                                                                0,
                                                                                100
                                                                            ) + '…'
                                                                        ) : element[col.key]
                                                                              ?.toString()
                                                                              .trim() ? (
                                                                            element[col.key]
                                                                        ) : (
                                                                            <span
                                                                                style={{
                                                                                    color: '#bbb',
                                                                                }}
                                                                            >
                                                                                —
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <ActionIcon
                                                                        color="blue"
                                                                        variant="light"
                                                                        size={
                                                                            isMobile ? 'xs' : 'sm'
                                                                        }
                                                                        onClick={() =>
                                                                            handleCellEditStart(
                                                                                element.id,
                                                                                col.key,
                                                                                element[col.key]
                                                                            )
                                                                        }
                                                                        aria-label="Edit"
                                                                    >
                                                                        <LuPencil
                                                                            size={
                                                                                isMobile ? 12 : 14
                                                                            }
                                                                        />
                                                                    </ActionIcon>
                                                                </Group>
                                                            )}
                                                        </Table.Td>
                                                    )
                                                })}
                                                <Table.Td
                                                    style={{
                                                        padding: isMobile
                                                            ? theme.spacing.xs
                                                            : undefined,
                                                        width: '120px',
                                                    }}
                                                >
                                                    <Group gap="xs" wrap="nowrap">
                                                        <Tooltip label="Modifier la ligne">
                                                            <ActionIcon
                                                                color="blue"
                                                                variant="filled"
                                                                size={isMobile ? 'xs' : 'sm'}
                                                                onClick={() =>
                                                                    handleEditModalOpen(element)
                                                                }
                                                                aria-label="Edit row"
                                                            >
                                                                <LuPencil
                                                                    size={isMobile ? 14 : 16}
                                                                />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Dupliquer">
                                                            <ActionIcon
                                                                color="teal"
                                                                variant="filled"
                                                                size={isMobile ? 'xs' : 'sm'}
                                                                onClick={() =>
                                                                    handleDuplicate(element)
                                                                }
                                                                aria-label="Duplicate"
                                                            >
                                                                <LuCopy size={isMobile ? 14 : 16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Supprimer">
                                                            <ActionIcon
                                                                color="red"
                                                                variant="light"
                                                                size={isMobile ? 'xs' : 'sm'}
                                                                onClick={() =>
                                                                    handleDelete(element.id)
                                                                }
                                                                aria-label="Delete"
                                                            >
                                                                <LuTrash2
                                                                    size={isMobile ? 14 : 16}
                                                                />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))
                                    ) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={columns.length + 1}>
                                                <Center py="lg">Aucun résultat</Center>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                                <Table.Caption>
                                    {dataToShow.length} / {filteredSorted.length} posts
                                    {useInfiniteScroll && dataToShow.length < filteredSorted.length
                                        ? ' (Scroll pour charger plus)'
                                        : ''}
                                </Table.Caption>
                            </Table>
                        </ScrollArea>
                    </div>
                </SortableContext>
            </DndContext>
        </>
    )
}
