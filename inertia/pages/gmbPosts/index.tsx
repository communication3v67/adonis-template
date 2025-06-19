import { Head, router } from '@inertiajs/react'
import { Stack } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { SSE_CLIENT_CONFIG } from '../../config/sse'
import { useSSE } from '../../hooks/useSSE'
import { ColumnConfig } from '../../components/gmbPosts/components/Table/ColumnVisibilityManager'

// Types et hooks
import {
    GmbPostsPageProps,
    useBulkActions,
    useFilters,
    useInfiniteScroll,
    usePostActions,
    useSelection,
    useWebhook,
} from '../../components/gmbPosts'

// Composants
import {
    BulkActionBar,
    EditPostModal,
    FilterSection,
    PageHeader,
    PostsTable,
    StatusIndicators,
    WebhookModal,
} from '../../components/gmbPosts'

export default function GmbPostsIndex({
    posts,
    filters: initialFilters,
    filterOptions,
    currentUser,
    postsToGenerateCount,
}: GmbPostsPageProps) {
    // usePoll(10000)
    // États locaux
    const [isClient, setIsClient] = useState(false)
    const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
    const [pendingUpdates, setPendingUpdates] = useState<number>(0)
    const [refreshKey, setRefreshKey] = useState<number>(0) // Clé pour forcer le re-render

    // Configuration des colonnes avec largeurs par défaut
    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: 'checkbox', label: 'Sélection', visible: true, width: 80, minWidth: 60, maxWidth: 100, required: true },
        { key: 'status', label: 'Statut', visible: true, width: 220, minWidth: 150, maxWidth: 300 },
        { key: 'text', label: 'Texte', visible: true, width: 600, minWidth: 250, maxWidth: 900 },
        { key: 'date', label: 'Date', visible: true, width: 220, minWidth: 150, maxWidth: 270 },
        { key: 'keyword', label: 'Mot-clé', visible: true, width: 200, minWidth: 130, maxWidth: 300 },
        { key: 'client', label: 'Client', visible: true, width: 220, minWidth: 150, maxWidth: 350 },
        { key: 'project_name', label: 'Projet', visible: true, width: 250, minWidth: 150, maxWidth: 400 },
        { key: 'city', label: 'Ville', visible: true, width: 190, minWidth: 130, maxWidth: 300 },
        { key: 'price', label: 'Prix IA', visible: true, width: 160, minWidth: 120, maxWidth: 220 },
        { key: 'model', label: 'Modèle IA', visible: false, width: 180, minWidth: 130, maxWidth: 250 },
        { key: 'input_tokens', label: 'Tokens In', visible: false, width: 160, minWidth: 120, maxWidth: 200 },
        { key: 'output_tokens', label: 'Tokens Out', visible: false, width: 160, minWidth: 120, maxWidth: 200 },
        { key: 'image_url', label: 'Image', visible: false, width: 160, minWidth: 120, maxWidth: 250 },
        { key: 'link_url', label: 'Lien', visible: false, width: 160, minWidth: 120, maxWidth: 250 },
        { key: 'location_id', label: 'Location ID', visible: false, width: 200, minWidth: 150, maxWidth: 300 },
        { key: 'account_id', label: 'Account ID', visible: false, width: 200, minWidth: 150, maxWidth: 300 },
        { key: 'notion_id', label: 'Notion ID', visible: false, width: 200, minWidth: 150, maxWidth: 300 },
        { key: 'actions', label: 'Actions', visible: true, width: 220, minWidth: 180, maxWidth: 280, required: true },
    ])

    // Fonction pour réinitialiser les largeurs
    const resetWidths = () => {
        setColumns(prev => prev.map(col => {
            switch (col.key) {
                case 'checkbox': return { ...col, width: 80 }
                case 'status': return { ...col, width: 220 }
                case 'text': return { ...col, width: 600 }
                case 'date': return { ...col, width: 220 }
                case 'keyword': return { ...col, width: 200 }
                case 'client': return { ...col, width: 220 }
                case 'project_name': return { ...col, width: 250 }
                case 'city': return { ...col, width: 190 }
                case 'price': return { ...col, width: 160 }
                case 'model': return { ...col, width: 180 }
                case 'input_tokens': return { ...col, width: 160 }
                case 'output_tokens': return { ...col, width: 160 }
                case 'image_url': return { ...col, width: 160 }
                case 'link_url': return { ...col, width: 160 }
                case 'location_id': return { ...col, width: 200 }
                case 'account_id': return { ...col, width: 200 }
                case 'notion_id': return { ...col, width: 200 }
                case 'actions': return { ...col, width: 220 }
                default: return col
            }
        }))
    }

    // Hooks personnalisés
    const { filters, updateFilter, isApplyingFilters, applyFilters, resetFilters, handleSort } =
        useFilters(initialFilters)

    // Forcer la mise à jour des hooks dépendants en cas de changement SSE
    const processedPosts = useMemo(() => {
        // Ajouter la clé de rafraîchissement comme métadonnées pour forcer la mise à jour
        return {
            ...posts,
            _refreshKey: refreshKey, // Force la re-création de l'objet
        }
    }, [posts, refreshKey])

    const { posts: infinitePosts, hasMore, isLoading } = useInfiniteScroll(processedPosts, filters)

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

    // Hook SSE personnalisé
    const { isConnected, connectionStatus, reconnect, setCallbacks } = useSSE(currentUser.id)

    const {
        editingPost,
        editModalOpened,
        handleEdit,
        closeEditModal,
        handleInlineEdit,
        handleDelete,
        handleDuplicate,
    } = usePostActions()

    // Fonction pour rafraîchir les données
    const refreshData = () => {
        console.log('🔄 Rafraîchissement des données via Inertia...')
        setRefreshKey((prev) => prev + 1) // Forcer le re-render des hooks
        router.reload({
            only: ['posts', 'postsToGenerateCount'],
            onSuccess: () => {
                console.log('✅ Données rafraîchies avec succès')
                setPendingUpdates(0)
                setLastUpdateTime(new Date().toLocaleTimeString())
            },
            onError: () => {
                console.error('❌ Erreur lors du rafraîchissement')
            },
        })
    }

    // Gestion de l'hydratation et SSE
    useEffect(() => {
        setIsClient(true)

        console.log('=== DEBUG FRONTEND ===')
        console.log('Posts reçus:', posts)
        console.log('postsToGenerateCount reçu:', postsToGenerateCount)
        console.log('currentUser.notion_id:', currentUser.notion_id)
        console.log('SSE Connection Status:', connectionStatus)
        console.log('SSE Is Connected:', isConnected)
        console.log('=====================')

        // Configurer les callbacks SSE
        if (isConnected) {
            setCallbacks({
                onPostUpdate: (event) => {
                    console.log('📨 Post update reçu:', event)

                    setPendingUpdates((prev) => prev + 1)

                    if (event.data.action === 'created') {
                        console.log('🆕 Nouveau post créé:', event.data.text)
                        // Rafraîchir avec délai configurable
                        setTimeout(refreshData, SSE_CLIENT_CONFIG.REFRESH_DELAY)
                    } else if (event.data.action === 'updated') {
                        console.log('✏️ Post mis à jour:', event.data.text)
                        // Rafraîchir avec délai configurable
                        setTimeout(refreshData, SSE_CLIENT_CONFIG.REFRESH_DELAY)
                    } else if (event.data.action === 'deleted') {
                        console.log('🗑️ Post supprimé:', event.data.id)
                        // Rafraîchir avec délai configurable
                        setTimeout(refreshData, SSE_CLIENT_CONFIG.REFRESH_DELAY)
                    }
                },
                onNotification: (event) => {
                    console.log('🔔 Notification SSE reçue:', event.data.title)
                    // La notification est déjà affichée automatiquement par le hook
                },
            })
        }
    }, [
        posts,
        postsToGenerateCount,
        currentUser.notion_id,
        isConnected,
        connectionStatus,
        setCallbacks,
    ])

    // Effet pour détecter les changements de posts et s'assurer que les hooks dépendants se mettent à jour
    useEffect(() => {
        console.log('📊 Changement détecté dans les posts:', {
            totalPosts: posts.meta.total,
            loadedPosts: posts.data.length,
            refreshKey,
            timestamp: new Date().toISOString(),
        })
    }, [posts, refreshKey])

    // Effet pour détecter les changements de posts et s'assurer que les hooks dépendants se mettent à jour
    useEffect(() => {
        console.log('📊 Changement détecté dans les posts:', {
            totalPosts: posts.meta.total,
            loadedPosts: posts.data.length,
            refreshKey,
            timestamp: new Date().toISOString(),
        })
    }, [posts, refreshKey])

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
                <div
                    style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}
                >
                    {/* Indicateurs de statut */}
                    <StatusIndicators
                        postsLoaded={infinitePosts.length}
                        totalPosts={posts.meta.total}
                        hasMore={hasMore}
                        currentUser={currentUser}
                        activeFiltersCount={activeFiltersCount}
                        connectionStatus={connectionStatus}
                        isConnected={isConnected}
                        pendingUpdates={pendingUpdates}
                        lastUpdateTime={lastUpdateTime}
                        onRefresh={refreshData}
                        columns={columns}
                        onColumnsChange={setColumns}
                        onResetWidths={resetWidths}
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
                        columns={columns}
                        onColumnsChange={setColumns}
                        onResetWidths={resetWidths}
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
