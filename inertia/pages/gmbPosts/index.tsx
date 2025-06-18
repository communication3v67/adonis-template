import { Head } from '@inertiajs/react'
import { Stack } from '@mantine/core'
import { useEffect, useState } from 'react'

// Types et hooks
import {
    GmbPostsPageProps,
    useFilters,
    useInfiniteScroll,
    useSelection,
    useBulkActions,
    useWebhook,
    usePostActions,
} from '../../components/gmbPosts'

// Composants
import {
    PageHeader,
    StatusIndicators,
    FilterSection,
    BulkActionBar,
    PostsTable,
    EditPostModal,
    WebhookModal,
} from '../../components/gmbPosts'

export default function GmbPostsIndex({
    posts,
    filters: initialFilters,
    filterOptions,
    currentUser,
    postsToGenerateCount,
}: GmbPostsPageProps) {
    // États locaux
    const [isClient, setIsClient] = useState(false)

    // Hooks personnalisés
    const {
        filters,
        updateFilter,
        isApplyingFilters,
        applyFilters,
        resetFilters,
        handleSort,
    } = useFilters(initialFilters)

    const { posts: infinitePosts, hasMore, isLoading } = useInfiniteScroll(posts, filters)

    const {
        selectedPosts,
        toggleSelectAll,
        toggleSelectPost,
        clearSelection,
        isSelected,
        isAllSelected,
        isIndeterminate,
        selectedCount,
    } = useSelection(infinitePosts)

    const {
        bulkEditData,
        updateBulkEditField,
        hasAnyBulkChanges,
        resetBulkEdit,
        handleBulkEdit,
        handleBulkDelete,
    } = useBulkActions()

    const {
        sendingToN8n,
        sendingSinglePost,
        webhookResponse,
        showWebhookModal,
        sendPostsToN8n,
        sendSinglePostToN8n,
        closeWebhookModal,
    } = useWebhook()

    const {
        editingPost,
        editModalOpened,
        handleEdit,
        closeEditModal,
        handleInlineEdit,
        handleDelete,
        handleDuplicate,
    } = usePostActions()

    // Gestion de l'hydratation
    useEffect(() => {
        setIsClient(true)
        
        console.log('=== DEBUG FRONTEND ===')
        console.log('Posts reçus:', posts)
        console.log('postsToGenerateCount reçu:', postsToGenerateCount)
        console.log('currentUser.notion_id:', currentUser.notion_id)
        console.log('=====================')
    }, [])

    // Calcul du nombre de filtres actifs
    const activeFiltersCount = [
        filters.search,
        filters.status,
        filters.client,
        filters.project,
        filters.dateFrom,
        filters.dateTo,
    ].filter(Boolean).length

    // Gestion de l'envoi vers n8n
    const handleSendToN8n = () => {
        sendPostsToN8n(postsToGenerateCount)
    }

    // Gestion des actions en masse avec nettoyage de sélection
    const handleBulkEditWithClear = () => {
        handleBulkEdit(selectedPosts)
        clearSelection()
    }

    const handleBulkDeleteWithClear = () => {
        handleBulkDelete(selectedPosts)
        clearSelection()
    }

    // Gestion de la mise à jour des filtres de date
    const handleUpdateDateRange = (dateFrom: string, dateTo: string) => {
        updateFilter('dateFrom', dateFrom)
        updateFilter('dateTo', dateTo)
    }

    return (
        <>
            <Head title="Posts GMB" />

            <Stack gap="md">
                {/* En-tête */}
                <PageHeader
                    currentUser={currentUser}
                    postsToGenerateCount={postsToGenerateCount}
                    sendingToN8n={sendingToN8n}
                    onSendToN8n={handleSendToN8n}
                />

                {/* Section des filtres */}
                <FilterSection
                    filters={filters}
                    filterOptions={filterOptions}
                    totalResults={posts.meta.total}
                    isApplyingFilters={isApplyingFilters}
                    onUpdateFilter={updateFilter}
                    onUpdateDateRange={handleUpdateDateRange}
                    onApplyFilters={applyFilters}
                    onResetFilters={resetFilters}
                    onRemoveFilter={(key) => updateFilter(key, '')}
                />

                {/* Actions en masse */}
                {selectedCount > 0 && (
                    <BulkActionBar
                        selectedCount={selectedCount}
                        bulkEditData={bulkEditData}
                        filterOptions={filterOptions}
                        hasAnyBulkChanges={hasAnyBulkChanges()}
                        onUpdateField={updateBulkEditField}
                        onBulkEdit={handleBulkEditWithClear}
                        onBulkDelete={handleBulkDeleteWithClear}
                        onResetBulkEdit={resetBulkEdit}
                    />
                )}

                {/* Tableau */}
                <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
                    {/* Indicateurs de statut */}
                    <StatusIndicators
                        postsLoaded={infinitePosts.length}
                        totalPosts={posts.meta.total}
                        hasMore={hasMore}
                        currentUser={currentUser}
                        activeFiltersCount={activeFiltersCount}
                    />

                    {/* Tableau des posts */}
                    <PostsTable
                        posts={infinitePosts}
                        selectedPosts={selectedPosts}
                        sendingSinglePost={sendingSinglePost}
                        filterOptions={filterOptions}
                        filters={filters}
                        isAllSelected={isAllSelected}
                        isIndeterminate={isIndeterminate}
                        hasMore={hasMore}
                        isLoading={isLoading}
                        onSelectAll={toggleSelectAll}
                        onSelectPost={toggleSelectPost}
                        onSort={handleSort}
                        onInlineEdit={handleInlineEdit}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onSendToN8n={sendSinglePostToN8n}
                    />
                </div>

                {/* Modal d'édition */}
                <EditPostModal
                    post={editingPost}
                    opened={editModalOpened}
                    onClose={closeEditModal}
                    filterOptions={filterOptions}
                />

                {/* Modal webhook */}
                <WebhookModal
                    opened={showWebhookModal}
                    response={webhookResponse}
                    onClose={closeWebhookModal}
                />
            </Stack>
        </>
    )
}
