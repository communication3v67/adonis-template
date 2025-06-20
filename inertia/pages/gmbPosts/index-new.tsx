import { Head } from '@inertiajs/react'
import { Card, Stack } from '@mantine/core'
import { useEffect, useState } from 'react'

// Types
import { GmbPostsPageProps } from '../../components/gmbPosts/types'

// Hooks personnalisés
import { useFilters } from '../../components/gmbPosts/hooks/useFilters'
import { useInfiniteScroll } from '../../components/gmbPosts/hooks/useInfiniteScroll'
import { useSelection } from '../../components/gmbPosts/hooks/useSelection'
import { useBulkActions } from '../../components/gmbPosts/hooks/useBulkActions'
import { useWebhook } from '../../components/gmbPosts/hooks/useWebhook'

// Composants
import { PageHeader } from '../../components/gmbPosts/components/Layout/PageHeader'
import { StatusIndicators } from '../../components/gmbPosts/components/Layout/StatusIndicators'

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

                {/* Section des filtres - À implémenter */}
                <Card withBorder p="md">
                    {/* TODO: Implémenter FilterSection */}
                    <div>Section des filtres (à implémenter)</div>
                </Card>

                {/* Actions en masse - À implémenter si posts sélectionnés */}
                {selectedCount > 0 && (
                    <Card withBorder p="md" bg="blue.0">
                        {/* TODO: Implémenter BulkActionBar */}
                        <div>Actions en masse: {selectedCount} post(s) sélectionné(s)</div>
                    </Card>
                )}

                {/* Tableau */}
                <Card withBorder>
                    {/* Indicateurs de statut */}
                    <StatusIndicators
                        postsLoaded={infinitePosts.length}
                        totalPosts={posts.meta.total}
                        hasMore={hasMore}
                        currentUser={currentUser}
                        activeFiltersCount={activeFiltersCount}
                    />

                    {/* TODO: Implémenter PostsTable */}
                    <div style={{ padding: '1rem' }}>
                        <div>Tableau des posts (à implémenter)</div>
                        <div>Posts chargés: {infinitePosts.length}</div>
                        <div>Posts sélectionnés: {selectedCount}</div>
                        <div>Chargement: {isLoading ? 'Oui' : 'Non'}</div>
                        <div>Plus de posts: {hasMore ? 'Oui' : 'Non'}</div>
                    </div>
                </Card>

                {/* TODO: Implémenter les modales */}
                {/* Modal d'édition */}
                {/* Modal webhook */}
            </Stack>
        </>
    )
}
