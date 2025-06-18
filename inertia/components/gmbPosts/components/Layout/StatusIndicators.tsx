import { Badge, Box, Group, Text } from '@mantine/core'
import { CurrentUser } from '../../types'

interface StatusIndicatorsProps {
    postsLoaded: number
    totalPosts: number
    hasMore: boolean
    currentUser: CurrentUser
    activeFiltersCount: number
}

export const StatusIndicators = ({
    postsLoaded,
    totalPosts,
    hasMore,
    currentUser,
    activeFiltersCount,
}: StatusIndicatorsProps) => {
    return (
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
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
                
                {activeFiltersCount > 0 && (
                    <>
                        <Text size="sm" c="dimmed">•</Text>
                        <Badge variant="outline" color="orange" size="sm">
                            🔍 {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                        </Badge>
                    </>
                )}
            </Group>
        </Box>
    )
}
