import { Checkbox, Table, Text, Box, Group } from '@mantine/core'
import { useState, useMemo } from 'react'
import { GmbPost, FilterOptions, FilterState } from '../../types'
import { SortableHeader } from './SortableHeader'
import { PostRow } from './PostRow'
import { ColumnVisibilityManager, ColumnConfig } from './ColumnVisibilityManager'
import { ResizableColumn } from './ResizableColumn'

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
}: PostsTableProps) => {
    // Configuration des colonnes avec largeurs par défaut
    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: 'checkbox', label: 'Sélection', visible: true, width: 60, minWidth: 60, maxWidth: 80, required: true },
        { key: 'status', label: 'Statut', visible: true, width: 180, minWidth: 120, maxWidth: 250 },
        { key: 'text', label: 'Texte', visible: true, width: 500, minWidth: 200, maxWidth: 800 },
        { key: 'date', label: 'Date', visible: true, width: 180, minWidth: 120, maxWidth: 220 },
        { key: 'keyword', label: 'Mot-clé', visible: true, width: 160, minWidth: 100, maxWidth: 250 },
        { key: 'client', label: 'Client', visible: true, width: 180, minWidth: 120, maxWidth: 300 },
        { key: 'project_name', label: 'Projet', visible: true, width: 200, minWidth: 120, maxWidth: 350 },
        { key: 'city', label: 'Ville', visible: true, width: 150, minWidth: 100, maxWidth: 250 },
        { key: 'image_url', label: 'Image', visible: false, width: 120, minWidth: 80, maxWidth: 200 },
        { key: 'link_url', label: 'Lien', visible: false, width: 120, minWidth: 80, maxWidth: 200 },
        { key: 'location_id', label: 'Location ID', visible: false, width: 160, minWidth: 100, maxWidth: 250 },
        { key: 'account_id', label: 'Account ID', visible: false, width: 160, minWidth: 100, maxWidth: 250 },
        { key: 'notion_id', label: 'Notion ID', visible: false, width: 160, minWidth: 100, maxWidth: 250 },
        { key: 'actions', label: 'Actions', visible: true, width: 180, minWidth: 150, maxWidth: 220, required: true },
    ])

    // Colonnes visibles uniquement
    const visibleColumns = useMemo(() => 
        columns.filter(col => col.visible), 
        [columns]
    )

    // Calculer la largeur minimale dynamiquement
    const getColumnWidth = (key: string) => {
        const column = columns.find(col => col.key === key)
        return column ? column.width : 120
    }

    const totalWidth = useMemo(() => {
        return visibleColumns.reduce((sum, col) => sum + col.width, 0)
    }, [visibleColumns])

    // Fonction pour redimensionner une colonne
    const handleColumnResize = (key: string, newWidth: number) => {
        setColumns(prev => prev.map(col => 
            col.key === key ? { ...col, width: newWidth } : col
        ))
    }

    // Fonction pour réinitialiser les largeurs
    const resetWidths = () => {
        setColumns(prev => prev.map(col => {
            switch (col.key) {
                case 'checkbox': return { ...col, width: 60 }
                case 'status': return { ...col, width: 180 }
                case 'text': return { ...col, width: 500 }
                case 'date': return { ...col, width: 180 }
                case 'keyword': return { ...col, width: 160 }
                case 'client': return { ...col, width: 180 }
                case 'project_name': return { ...col, width: 200 }
                case 'city': return { ...col, width: 150 }
                case 'image_url': return { ...col, width: 120 }
                case 'link_url': return { ...col, width: 120 }
                case 'location_id': return { ...col, width: 160 }
                case 'account_id': return { ...col, width: 160 }
                case 'notion_id': return { ...col, width: 160 }
                case 'actions': return { ...col, width: 180 }
                default: return col
            }
        }))
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
            {/* Gestionnaire de colonnes */}
            <Group justify="flex-end" mb="md">
                <ColumnVisibilityManager
                    columns={columns}
                    onColumnsChange={setColumns}
                    onResetWidths={resetWidths}
                />
            </Group>

            <Box style={{ overflowX: 'auto' }}>
                <Table 
                    striped 
                    highlightOnHover 
                    style={{ 
                        minWidth: `${totalWidth}px`, 
                        tableLayout: 'fixed',
                        '--mantine-table-border-color': '#e9ecef'
                    }} 
                    verticalSpacing="lg" 
                    horizontalSpacing="lg"
                >
                    <Table.Thead>
                        <Table.Tr style={{ height: '50px' }}>
                            {visibleColumns.map((column) => {
                                if (column.key === 'checkbox') {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) => handleColumnResize(column.key, newWidth)}
                                            style={{ textAlign: 'center' }}
                                        >
                                            <Checkbox
                                                checked={isAllSelected}
                                                indeterminate={isIndeterminate}
                                                onChange={onSelectAll}
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
                                            onResize={(newWidth) => handleColumnResize(column.key, newWidth)}
                                            style={{ textAlign: 'center' }}
                                        >
                                            Actions
                                        </ResizableColumn>
                                    )
                                }
                                // Colonnes avec tri
                                const sortableColumns = ['status', 'text', 'date', 'keyword', 'client', 'project_name', 'city']
                                if (sortableColumns.includes(column.key)) {
                                    return (
                                        <ResizableColumn
                                            key={column.key}
                                            width={column.width}
                                            minWidth={column.minWidth}
                                            maxWidth={column.maxWidth}
                                            onResize={(newWidth) => handleColumnResize(column.key, newWidth)}
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
                                        onResize={(newWidth) => handleColumnResize(column.key, newWidth)}
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
