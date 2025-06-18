import { Checkbox, Table, Text, Box, Group } from '@mantine/core'
import { GmbPost, FilterOptions, FilterState } from '../../types'
import { SortableHeader } from './SortableHeader'
import { PostRow } from './PostRow'

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
                <Table striped highlightOnHover style={{ minWidth: '2450px', tableLayout: 'fixed' }} verticalSpacing="lg" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr style={{ height: '50px' }}>
                            <Table.Th style={{ width: '60px', textAlign: 'center', verticalAlign: 'middle', padding: '8px' }}>
                                <Checkbox
                                    checked={isAllSelected}
                                    indeterminate={isIndeterminate}
                                    onChange={onSelectAll}
                                />
                            </Table.Th>
                            <Table.Th style={{ width: '180px', verticalAlign: 'middle', padding: '8px' }}>
                                <SortableHeader
                                    label="Statut"
                                    sortKey="status"
                                    currentSortBy={filters.sortBy}
                                    currentSortOrder={filters.sortOrder}
                                    onSort={onSort}
                                />
                            </Table.Th>
                            <Table.Th style={{ width: '500px', minWidth: '400px', verticalAlign: 'middle', padding: '8px' }}>
                                <SortableHeader
                                    label="Texte"
                                    sortKey="text"
                                    currentSortBy={filters.sortBy}
                                    currentSortOrder={filters.sortOrder}
                                    onSort={onSort}
                                />
                            </Table.Th>
                            <Table.Th style={{ width: '180px', verticalAlign: 'middle', padding: '8px' }}>
                                <SortableHeader
                                    label="Date"
                                    sortKey="date"
                                    currentSortBy={filters.sortBy}
                                    currentSortOrder={filters.sortOrder}
                                    onSort={onSort}
                                />
                            </Table.Th>
                            <Table.Th style={{ width: '160px', verticalAlign: 'middle', padding: '8px' }}>
                                <SortableHeader
                                    label="Mot-clé"
                                    sortKey="keyword"
                                    currentSortBy={filters.sortBy}
                                    currentSortOrder={filters.sortOrder}
                                    onSort={onSort}
                                />
                            </Table.Th>
                            <Table.Th style={{ width: '180px', verticalAlign: 'middle', padding: '8px' }}>
                                <SortableHeader
                                    label="Client"
                                    sortKey="client"
                                    currentSortBy={filters.sortBy}
                                    currentSortOrder={filters.sortOrder}
                                    onSort={onSort}
                                />
                            </Table.Th>
                            <Table.Th style={{ width: '200px', verticalAlign: 'middle', padding: '8px' }}>
                                <SortableHeader
                                    label="Projet"
                                    sortKey="project_name"
                                    currentSortBy={filters.sortBy}
                                    currentSortOrder={filters.sortOrder}
                                    onSort={onSort}
                                />
                            </Table.Th>
                            <Table.Th style={{ width: '120px', verticalAlign: 'middle', padding: '8px' }}>Image</Table.Th>
                            <Table.Th style={{ width: '120px', verticalAlign: 'middle', padding: '8px' }}>Lien</Table.Th>
                            <Table.Th style={{ width: '160px', verticalAlign: 'middle', padding: '8px' }}>Location ID</Table.Th>
                            <Table.Th style={{ width: '160px', verticalAlign: 'middle', padding: '8px' }}>Account ID</Table.Th>
                            <Table.Th style={{ width: '160px', verticalAlign: 'middle', padding: '8px' }}>Notion ID</Table.Th>
                            <Table.Th style={{ width: '180px', verticalAlign: 'middle', padding: '8px', textAlign: 'center' }}>Actions</Table.Th>
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
