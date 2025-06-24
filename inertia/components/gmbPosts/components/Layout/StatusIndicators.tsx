import { Badge, Box, Button, Group, Text } from '@mantine/core'
import { LuRefreshCw } from 'react-icons/lu'
import { CurrentUser } from '../../types'
import { ColumnVisibilityManager, ColumnConfig } from '../Table/ColumnVisibilityManager'

interface StatusIndicatorsProps {
    postsLoaded: number
    totalPosts: number
    hasMore: boolean
    currentUser: CurrentUser
    activeFiltersCount: number
    connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error'
    isConnected?: boolean
    pendingUpdates?: number
    lastUpdateTime?: string | null
    onRefresh?: () => void
    // Props pour la gestion des colonnes
    columns?: ColumnConfig[]
    onColumnsChange?: (columns: ColumnConfig[]) => void
    onResetWidths?: () => void
    onResetToDefaults?: () => void
}

export const StatusIndicators = ({
    postsLoaded,
    totalPosts,
    hasMore,
    currentUser,
    activeFiltersCount,
    connectionStatus = 'disconnected',
    isConnected = false,
    pendingUpdates = 0,
    lastUpdateTime = null,
    onRefresh,
    columns,
    onColumnsChange,
    onResetWidths,
    onResetToDefaults,
}: StatusIndicatorsProps) => {
    // Déterminer l'affichage du statut SSE
    const getSSEBadge = () => {
        if (isConnected && connectionStatus === 'connected') {
            return (
                <Badge variant="light" color="green" size="sm">
                    🟢 Temps réel
                </Badge>
            )
        } else if (connectionStatus === 'connecting') {
            return (
                <Badge variant="light" color="yellow" size="sm">
                    🟡 Connexion...
                </Badge>
            )
        } else if (connectionStatus === 'error') {
            return (
                <Badge variant="light" color="red" size="sm">
                    🔴 Erreur SSE
                </Badge>
            )
        }
        return null
    }
    return (
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
            <Group gap="xs" align="center" justify="space-between">
                <Group gap="xs" align="center">
                    <Text size="sm" c="dimmed">
                        {postsLoaded} post{postsLoaded > 1 ? 's' : ''} chargé
                        {postsLoaded > 1 ? 's' : ''}
                        {hasMore && <> sur {totalPosts} total</>}
                    </Text>
                    
                    <Text size="sm" c="dimmed">•</Text>
                    
                    <Badge variant="outline" color="blue" size="sm">
                        👤 {currentUser.username}
                    </Badge>
                    
                    {currentUser.notion_id && (
                        <Badge variant="outline" color="violet" size="sm">
                            🔗 Notion
                        </Badge>
                    )}
                    
                    {/* Indicateur SSE */}
                    {getSSEBadge()}
                    
                    {/* Indicateur de mises à jour en attente */}
                    {pendingUpdates > 0 && (
                        <Badge variant="filled" color="orange" size="sm">
                            📽 {pendingUpdates} mise{pendingUpdates > 1 ? 's' : ''} à jour
                        </Badge>
                    )}
                    
                    {activeFiltersCount > 0 && (
                        <>
                            <Text size="sm" c="dimmed">•</Text>
                            <Badge variant="outline" color="orange" size="sm">
                                🔍 {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                            </Badge>
                        </>
                    )}
                    
                    {lastUpdateTime && (
                        <>
                            <Text size="sm" c="dimmed">•</Text>
                            <Text size="xs" c="dimmed">
                                Dernière MAJ: {lastUpdateTime}
                            </Text>
                        </>
                    )}
                </Group>
                
                {/* Boutons d'actions */}
                <Group gap="xs">
                    {/* Gestionnaire de colonnes */}
                    {columns && onColumnsChange && (
                        <ColumnVisibilityManager
                            columns={columns}
                            onColumnsChange={onColumnsChange}
                            onResetWidths={onResetWidths}
                            onResetToDefaults={onResetToDefaults}
                        />
                    )}
                    
                    {/* Bouton de rafraîchissement manuel */}
                    {onRefresh && (
                        <Button
                            variant="subtle"
                            size="xs"
                            leftSection={<LuRefreshCw size={14} />}
                            onClick={onRefresh}
                            color={pendingUpdates > 0 ? 'orange' : 'gray'}
                        >
                            Actualiser
                        </Button>
                    )}
                </Group>
            </Group>
        </Box>
    )
}
