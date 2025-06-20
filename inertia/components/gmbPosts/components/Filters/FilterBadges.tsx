import { Badge } from '@mantine/core'
import { LuX } from 'react-icons/lu'
import { FilterState } from '../../types'

interface FilterBadgesProps {
    filters: FilterState
    onRemoveFilter: (key: keyof FilterState, value?: string) => void
}

export const FilterBadges = ({ filters, onRemoveFilter }: FilterBadgesProps) => {
    const badges = []

    if (filters.search) {
        badges.push(
            <Badge
                key="search"
                variant="outline"
                size="xs"
                color="blue"
                style={{ cursor: 'pointer' }}
                rightSection={
                    <LuX
                        size={10}
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFilter('search')
                        }}
                    />
                }
                onClick={() => onRemoveFilter('search')}
            >
                📝 "
                {filters.search.length > 15
                    ? filters.search.substring(0, 15) + '...'
                    : filters.search}
                "
            </Badge>
        )
    }

    if (filters.status) {
        badges.push(
            <Badge
                key="status"
                variant="outline"
                size="xs"
                color="green"
                style={{ cursor: 'pointer' }}
                rightSection={
                    <LuX
                        size={10}
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFilter('status')
                        }}
                    />
                }
                onClick={() => onRemoveFilter('status')}
            >
                🔄 {filters.status}
            </Badge>
        )
    }

    if (filters.client) {
        badges.push(
            <Badge
                key="client"
                variant="outline"
                size="xs"
                color="orange"
                style={{ cursor: 'pointer' }}
                rightSection={
                    <LuX
                        size={10}
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFilter('client')
                        }}
                    />
                }
                onClick={() => onRemoveFilter('client')}
            >
                👤 {filters.client}
            </Badge>
        )
    }

    if (filters.project) {
        badges.push(
            <Badge
                key="project"
                variant="outline"
                size="xs"
                color="violet"
                style={{ cursor: 'pointer' }}
                rightSection={
                    <LuX
                        size={10}
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFilter('project')
                        }}
                    />
                }
                onClick={() => onRemoveFilter('project')}
            >
                📁 {filters.project}
            </Badge>
        )
    }

    if (filters.sortBy !== 'date' || filters.sortOrder !== 'desc') {
        const sortLabels: Record<string, string> = {
            'date': 'Date',
            'status': 'Statut',
            'text': 'Texte',
            'client': 'Client',
            'project_name': 'Projet',
            'keyword': 'Mot-clé',
        }
        
        badges.push(
            <Badge
                key="sort"
                variant="outline"
                size="xs"
                color="gray"
                style={{ cursor: 'pointer' }}
                rightSection={
                    <LuX
                        size={10}
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFilter('sortBy')
                        }}
                    />
                }
                onClick={() => onRemoveFilter('sortBy')}
            >
                📊 Tri: {sortLabels[filters.sortBy] || filters.sortBy} (
                {filters.sortOrder === 'desc' ? '↓' : '↑'})
            </Badge>
        )
    }

    if (filters.dateFrom || filters.dateTo) {
        badges.push(
            <Badge
                key="dateRange"
                variant="outline"
                size="xs"
                color="teal"
                style={{ cursor: 'pointer' }}
                rightSection={
                    <LuX
                        size={10}
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFilter('dateFrom')
                            onRemoveFilter('dateTo')
                        }}
                    />
                }
                onClick={() => {
                    onRemoveFilter('dateFrom')
                    onRemoveFilter('dateTo')
                }}
            >
                📅 {filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo
                    ? `${filters.dateFrom}`
                    : `${filters.dateFrom || '...'} → ${filters.dateTo || '...'}`}
            </Badge>
        )
    }

    return <>{badges}</>
}
