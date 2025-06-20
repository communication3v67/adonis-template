import { Button, Group, Text } from '@mantine/core'
import { FilterState } from '../../types'
import { calculateQuickDateRange } from '../../utils/formatters'

interface QuickFiltersProps {
    onUpdateFilter: (key: keyof FilterState, value: string) => void
    onUpdateDateRange: (dateFrom: string, dateTo: string) => void
}

export const QuickFilters = ({ onUpdateFilter, onUpdateDateRange }: QuickFiltersProps) => {
    const handleQuickDateFilter = (period: string) => {
        if (period === 'today') {
            const today = new Date().toISOString().split('T')[0]
            onUpdateDateRange(today, today)
        } else if (period === 'tomorrow') {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const tomorrowStr = tomorrow.toISOString().split('T')[0]
            onUpdateDateRange(tomorrowStr, tomorrowStr)
        } else if (period === 'next7days') {
            const today = new Date()
            const next7 = new Date(today)
            next7.setDate(next7.getDate() + 7)
            onUpdateDateRange(
                today.toISOString().split('T')[0],
                next7.toISOString().split('T')[0]
            )
        } else {
            const { dateFrom, dateTo } = calculateQuickDateRange(period)
            onUpdateDateRange(dateFrom, dateTo)
        }
    }

    return (
        <Group gap="xs" align="center" wrap="wrap">
            <Text size="sm" fw={500} c="dimmed">
                Filtres rapides :
            </Text>
            
            {/* Filtres de statut */}
            <Button
                size="xs"
                variant="light"
                color="blue"
                onClick={() => onUpdateFilter('status', 'Titre généré')}
            >
                Titre généré
            </Button>
            <Button
                size="xs"
                variant="light"
                color="yellow"
                onClick={() => onUpdateFilter('status', 'Post à générer')}
            >
                Post à générer
            </Button>
            <Button
                size="xs"
                variant="light"
                color="violet"
                onClick={() => onUpdateFilter('status', 'Post à publier')}
            >
                Post à publier
            </Button>
            <Button
                size="xs"
                variant="light"
                color="green"
                onClick={() => onUpdateFilter('status', 'Publié')}
            >
                Publié
            </Button>

            <Text size="xs" c="dimmed" style={{ margin: '0 8px' }}>
                |
            </Text>

            {/* Filtres rapides de date */}
            <Button
                size="xs"
                variant="light"
                color="teal"
                onClick={() => handleQuickDateFilter('today')}
            >
                Aujourd'hui
            </Button>
            <Button
                size="xs"
                variant="light"
                color="teal"
                onClick={() => handleQuickDateFilter('tomorrow')}
            >
                Demain
            </Button>
            <Button
                size="xs"
                variant="light"
                color="teal"
                onClick={() => handleQuickDateFilter('next7days')}
            >
                7 prochains jours
            </Button>
        </Group>
    )
}
