import { ActionIcon, SimpleGrid } from '@mantine/core'
import { LuCalendar, LuDatabase, LuRefreshCw, LuTrendingUp } from 'react-icons/lu'
import { DatabaseInfo, Stats } from '../../types'
import { StatsCard } from '../Cards/StatsCard'

interface StatsGridProps {
    stats: Stats
    databaseInfo: DatabaseInfo | null
    isRefreshing: boolean
    onRefresh: () => void
}

export const StatsGrid = ({ stats, databaseInfo, isRefreshing, onRefresh }: StatsGridProps) => {
    // Formatage des dates
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <StatsCard
                title="Pages Notion"
                value={stats.totalPages}
                icon={<LuDatabase size={24} />}
                color="#228be6"
            />

            <StatsCard
                title="Recentes (7j)"
                value={stats.recentPages}
                icon={<LuCalendar size={24} />}
                color="#40c057"
            />

            <StatsCard
                title="Base de donnees"
                value={databaseInfo?.title || 'Non connectee'}
                icon={<LuTrendingUp size={24} />}
                color="#fd7e14"
            />

            <StatsCard
                title="Derniere sync"
                value={
                    databaseInfo
                        ? formatDate(databaseInfo.last_edited_time)
                        : 'N/A'
                }
                icon={
                    <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={onRefresh}
                        loading={isRefreshing}
                    >
                        <LuRefreshCw size={16} />
                    </ActionIcon>
                }
                color="#e03131"
            />
        </SimpleGrid>
    )
}
