import { Checkbox, Table, Text, Box, Group } from '@mantine/core'
import { useState, useMemo } from 'react'
import { GmbPost, FilterOptions, FilterState } from '../../types'
import { SortableHeader } from './SortableHeader'
import { PostRow } from './PostRow'
import { ColumnConfig } from './ColumnVisibilityManager'
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
    const visibleColumns = useMemo(() => 
        columns ? columns.filter(col => col.visible) : [], 
        [columns]
    )

    // Calculer la largeur minimale dynamiquement
    const getColumnWidth = (key: string) => {
        if (!columns) return 120
        const column = columns.find(col => col.key === key)
        return column ? column.width : 120
    }

    const totalWidth = useMemo(() => {
        return visibleColumns.reduce((sum, col) => sum + col.width, 0)
    }, [visibleColumns])

    // Fonction pour redimensionner une colonne
    const handleColumnResize = (key: string, newWidth: number) => {
        if (!columns || !onColumnsChange) return
        const updatedColumns = columns.map(col => 
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
                                const sortableColumns = ['status', 'text', 'date', 'keyword', 'client', 'project_name', 'city', 'price', 'model']
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
