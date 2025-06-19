import { Checkbox, Table, Text, Box, Group } from '@mantine/core'
import { useState, useMemo } from 'react'
import { GmbPost, FilterOptions, FilterState } from '../../types'
import { SortableHeader } from './SortableHeader'
import { PostRow } from './PostRow'
import { ColumnVisibilityManager, ColumnConfig } from './ColumnVisibilityManager'

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
    // Configuration des colonnes
    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: 'checkbox', label: 'Sélection', visible: true, required: true },
        { key: 'status', label: 'Statut', visible: true },
        { key: 'text', label: 'Texte', visible: true },
        { key: 'date', label: 'Date', visible: true },
        { key: 'keyword', label: 'Mot-clé', visible: true },
        { key: 'client', label: 'Client', visible: true },
        { key: 'project_name', label: 'Projet', visible: true },
        { key: 'image_url', label: 'Image', visible: false },
        { key: 'link_url', label: 'Lien', visible: false },
        { key: 'location_id', label: 'Location ID', visible: false },
        { key: 'account_id', label: 'Account ID', visible: false },
        { key: 'notion_id', label: 'Notion ID', visible: false },
        { key: 'actions', label: 'Actions', visible: true, required: true },
    ])

    // Colonnes visibles uniquement
    const visibleColumns = useMemo(() => 
        columns.filter(col => col.visible), 
        [columns]
    )

    // Calculer la largeur minimale dynamiquement
    const getColumnWidth = (key: string) => {
        switch (key) {
            case 'checkbox': return '60px'
            case 'status': return '180px'
            case 'text': return '500px'
            case 'date': return '180px'
            case 'keyword': return '160px'
            case 'client': return '180px'
            case 'project_name': return '200px'
            case 'image_url': return '120px'
            case 'link_url': return '120px'
            case 'location_id': return '160px'
            case 'account_id': return '160px'
            case 'notion_id': return '160px'
            case 'actions': return '180px'
            default: return '120px'
        }
    }

    const totalWidth = useMemo(() => {
        return visibleColumns.reduce((sum, col) => {
            const width = parseInt(getColumnWidth(col.key))
            return sum + width
        }, 0)
    }, [visibleColumns])
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
                />
            </Group>

            <Box style={{ overflowX: 'auto' }}>
                <Table striped highlightOnHover style={{ minWidth: `${totalWidth}px`, tableLayout: 'fixed' }} verticalSpacing="lg" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr style={{ height: '50px' }}>
                            {visibleColumns.map((column) => {
                                if (column.key === 'checkbox') {
                                    return (
                                        <Table.Th key={column.key} style={{ width: getColumnWidth(column.key), textAlign: 'center', verticalAlign: 'middle', padding: '8px' }}>
                                            <Checkbox
                                                checked={isAllSelected}
                                                indeterminate={isIndeterminate}
                                                onChange={onSelectAll}
                                            />
                                        </Table.Th>
                                    )
                                }
                                if (column.key === 'actions') {
                                    return (
                                        <Table.Th key={column.key} style={{ width: getColumnWidth(column.key), verticalAlign: 'middle', padding: '8px', textAlign: 'center' }}>
                                            Actions
                                        </Table.Th>
                                    )
                                }
                                // Colonnes avec tri
                                const sortableColumns = ['status', 'text', 'date', 'keyword', 'client', 'project_name']
                                if (sortableColumns.includes(column.key)) {
                                    return (
                                        <Table.Th key={column.key} style={{ width: getColumnWidth(column.key), verticalAlign: 'middle', padding: '8px' }}>
                                            <SortableHeader
                                                label={column.label}
                                                sortKey={column.key}
                                                currentSortBy={filters.sortBy}
                                                currentSortOrder={filters.sortOrder}
                                                onSort={onSort}
                                            />
                                        </Table.Th>
                                    )
                                }
                                // Colonnes simples
                                return (
                                    <Table.Th key={column.key} style={{ width: getColumnWidth(column.key), verticalAlign: 'middle', padding: '8px' }}>
                                        {column.label}
                                    </Table.Th>
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
