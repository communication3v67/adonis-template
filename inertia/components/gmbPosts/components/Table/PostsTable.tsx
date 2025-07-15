import { Box, Checkbox, Group, Table, Text, Tooltip } from '@mantine/core'
import { useMemo } from 'react'
import { LuCircleAlert, LuCircleCheck, LuImage, LuLink, LuShieldCheck, LuX } from 'react-icons/lu'
import { FilterOptions, FilterState, GmbPost } from '../../types'
import { ColumnConfig } from './ColumnVisibilityManager'
import { PostRow } from './PostRow'
import { ResizableColumn } from './ResizableColumn'
import { SortableHeader } from './SortableHeader'

interface PostsTableProps {
    posts: GmbPost[]
    selectedPosts: number[]
    sendingSinglePost: number | null
    filterOptions: FilterOptions
    filters: FilterState
    isAllSelected: boolean
    isIndeterminate: boolean
    hasMore: boolean
    isLoading: boolean
    onSelectAll: () => void
    onSelectPost: (postId: number) => void
    onSort: (sortBy: string, sortOrder: string) => void
    onInlineEdit: (postId: number, field: string, value: string) => Promise<void>
    onEdit: (post: GmbPost) => void
    onDelete: (postId: number) => void
    onDuplicate: (postId: number) => void
    onSendToN8n: (post: GmbPost) => void
    // Props pour la gestion des colonnes
    columns: ColumnConfig[]
    onColumnsChange: (columns: ColumnConfig[]) => void
    onResetWidths: () => void
}

export const PostsTable = ({
    posts,
    selectedPosts,
    sendingSinglePost,
    filterOptions,
    filters,
    isAllSelected,
    isIndeterminate,
    hasMore,
    isLoading,
    onSelectAll,
    onSelectPost,
    onSort,
    onInlineEdit,
    onEdit,
    onDelete,
    onDuplicate,
    onSendToN8n,
    columns,
    onColumnsChange,
    onResetWidths,
}: PostsTableProps) => {
    // Colonnes visibles uniquement
    const visibleColumns = useMemo(
        () => (columns ? columns.filter((col) => col.visible) : []),
        [columns]
    )

    // Calculer la largeur minimale dynamiquement
    const getColumnWidth = (key: string) => {
        if (!columns) return 120
        const column = columns.find((col) => col.key === key)
        return column ? column.width : 120
    }

    const totalWidth = useMemo(() => {
        return visibleColumns.reduce((sum, col) => sum + col.width, 0)
    }, [visibleColumns])

    // Fonction pour redimensionner une colonne
    const handleColumnResize = (key: string, newWidth: number) => {
        if (!columns || !onColumnsChange) return
        const updatedColumns = columns.map((col) =>
            col.key === key ? { ...col, width: newWidth } : col
        )
        onColumnsChange(updatedColumns)
    }

    if (posts.length === 0) {
        return (
            <Box p="xl" style={{ textAlign: 'center' }}>
                <Text size="lg" c="dimmed">
                    Aucun post trouvé
                </Text>
                <Text size="sm" c="dimmed" mt="xs">
                    Essayez de modifier vos filtres ou créez un nouveau post
                </Text>
            </Box>
        )
    }

    return (
        <>
            {/* Légende des icônes - version mise à jour */}
            <Box mb="xs" p="xs" style={{ borderRadius: '4px' }}>
                <Group gap="md" style={{ fontSize: '11px' }}>
                    <Group gap={4}>
                        <LuCircleCheck size={14} style={{ color: '#40c057' }} />
                        <Text size="xs" c="dimmed">
                            Prêt (génération)
                        </Text>
                    </Group>
                    <Group gap={4}>
                        <LuCircleCheck size={14} style={{ color: '#228be6' }} />
                        <Text size="xs" c="dimmed">
                            Prêt (publication)
                        </Text>
                    </Group>
                    <Group gap={4}>
                        <LuCircleAlert size={14} style={{ color: '#fd7e14' }} />
                        <Text size="xs" c="dimmed">
                            Incomplet (génération)
                        </Text>
                    </Group>
                    <Group gap={4}>
                        <LuX size={14} style={{ color: '#fa5252' }} />
                        <Text size="xs" c="dimmed">
                            Incomplet (publication)
                        </Text>
                    </Group>
                </Group>
            </Box>

            <Box style={{ overflowX: 'auto', marginBottom: '60px' }}>
                <Table
                    striped
                    highlightOnHover
                    style={{
                        'minWidth': `${totalWidth}px`,
                        'tableLayout': 'fixed',
                        '--mantine-table-border-color': '#ffffff',
                    }}
                    verticalSpacing="lg"
                    horizontalSpacing="lg"
                >
                    <Table.Thead style={{ outline: '0.06rem solid #3785d1' }}>
                        <Table.Tr style={{ height: '50px' }}>
                            {visibleColumns.map((column) => {
                                if (column.key === 'readiness') {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) =>
                                                handleColumnResize(column.key, newWidth)
                                            }
                                            style={{ textAlign: 'left' }}
                                        >
                                            <Tooltip
                                                label="Badges de préparation : Prêt pour génération/publication ou Incomplet"
                                                multiline
                                                withArrow
                                                position="bottom"
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        height: '100%',
                                                    }}
                                                >
                                                    <LuShieldCheck
                                                        size={16}
                                                        style={{ color: '#3785d1' }}
                                                    />
                                                </div>
                                            </Tooltip>
                                        </ResizableColumn>
                                    )
                                }
                                if (column.key === 'checkbox') {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) =>
                                                handleColumnResize(column.key, newWidth)
                                            }
                                            style={{ textAlign: 'left' }}
                                        >
                                            <Checkbox
                                                checked={isAllSelected}
                                                indeterminate={isIndeterminate}
                                                onChange={onSelectAll}
                                            />
                                        </ResizableColumn>
                                    )
                                }
                                if (column.key === 'id') {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) =>
                                                handleColumnResize(column.key, newWidth)
                                            }
                                        >
                                            <SortableHeader
                                                label={column.label}
                                                sortKey={column.key}
                                                currentSortBy={filters.sortBy}
                                                currentSortOrder={filters.sortOrder}
                                                onSort={onSort}
                                            />
                                        </ResizableColumn>
                                    )
                                }
                                if (column.key === 'actions') {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) =>
                                                handleColumnResize(column.key, newWidth)
                                            }
                                            style={{ textAlign: 'left' }}
                                        >
                                            Actions
                                        </ResizableColumn>
                                    )
                                }
                                // Colonnes avec icônes
                                if (column.key === 'image_url') {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) =>
                                                handleColumnResize(column.key, newWidth)
                                            }
                                            style={{ textAlign: 'left' }}
                                        >
                                            <Tooltip label="Image URL" withArrow position="bottom">
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        height: '100%',
                                                    }}
                                                >
                                                    <LuImage
                                                        size={16}
                                                        style={{ color: '#3785d1' }}
                                                    />
                                                </div>
                                            </Tooltip>
                                        </ResizableColumn>
                                    )
                                }
                                if (column.key === 'link_url') {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) =>
                                                handleColumnResize(column.key, newWidth)
                                            }
                                            style={{ textAlign: 'left' }}
                                        >
                                            <Tooltip label="Lien URL" withArrow position="bottom">
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        height: '100%',
                                                    }}
                                                >
                                                    <LuLink
                                                        size={16}
                                                        style={{ color: '#3785d1' }}
                                                    />
                                                </div>
                                            </Tooltip>
                                        </ResizableColumn>
                                    )
                                }
                                const sortableColumns = [
                                    'id',
                                    'status',
                                    'text',
                                    'date',
                                    'keyword',
                                    'client',
                                    'project_name',
                                    'city',
                                    'price',
                                    'model',
                                ]
                                if (sortableColumns.includes(column.key)) {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) =>
                                                handleColumnResize(column.key, newWidth)
                                            }
                                        >
                                            <SortableHeader
                                                label={column.label}
                                                sortKey={column.key}
                                                currentSortBy={filters.sortBy}
                                                currentSortOrder={filters.sortOrder}
                                                onSort={onSort}
                                            />
                                        </ResizableColumn>
                                    )
                                }
                                // Colonnes simples
                                return (
                                    <ResizableColumn
                                        key={column.key}
                                        width={column.width}
                                        minWidth={column.minWidth}
                                        maxWidth={column.maxWidth}
                                        onResize={(newWidth) =>
                                            handleColumnResize(column.key, newWidth)
                                        }
                                    >
                                        {column.label}
                                    </ResizableColumn>
                                )
                            })}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {posts.map((post) => (
                            <PostRow
                                key={post.id}
                                post={post}
                                isSelected={selectedPosts.includes(post.id)}
                                sendingSinglePost={sendingSinglePost}
                                filterOptions={filterOptions}
                                visibleColumns={visibleColumns}
                                getColumnWidth={getColumnWidth}
                                onSelect={onSelectPost}
                                onInlineEdit={onInlineEdit}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onDuplicate={onDuplicate}
                                onSendToN8n={onSendToN8n}
                            />
                        ))}
                    </Table.Tbody>
                </Table>
            </Box>

            {/* Indicateur de chargement / fin de liste */}
            {(hasMore || isLoading) && (
                <Box p="md" style={{ textAlign: 'center' }}>
                    {isLoading ? (
                        <Group justify="center" gap="xs">
                            <Text size="sm" c="dimmed">
                                Chargement de plus de posts...
                            </Text>
                        </Group>
                    ) : hasMore ? (
                        <Text size="sm" c="dimmed">
                            Faites défiler pour charger plus de posts
                        </Text>
                    ) : null}
                </Box>
            )}
        </>
    )
}
