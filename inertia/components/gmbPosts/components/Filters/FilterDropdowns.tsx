import { Group, Select } from '@mantine/core'
import { FilterState, FilterOptions } from '../../types'

interface FilterDropdownsProps {
    filters: FilterState
    filterOptions: FilterOptions
    onUpdate: (key: keyof FilterState, value: string) => void
}

export const FilterDropdowns = ({ filters, filterOptions, onUpdate }: FilterDropdownsProps) => {
    return (
        <Group grow>
            <Select
                placeholder="Filtrer par statut"
                data={[
                    { value: '', label: 'Tous les statuts' },
                    ...filterOptions.statuses.map((status) => ({
                        value: status,
                        label: status,
                    })),
                ]}
                value={filters.status}
                onChange={(value) => onUpdate('status', value || '')}
                clearable
            />
            
            <Select
                placeholder="Filtrer par client"
                data={[
                    { value: '', label: 'Tous les clients' },
                    ...filterOptions.clients.map((client) => ({
                        value: client,
                        label: client,
                    })),
                ]}
                value={filters.client}
                onChange={(value) => onUpdate('client', value || '')}
                searchable
                clearable
            />
            
            <Select
                placeholder="Filtrer par projet"
                data={[
                    { value: '', label: 'Tous les projets' },
                    ...filterOptions.projects.map((project) => ({
                        value: project,
                        label: project,
                    })),
                ]}
                value={filters.project}
                onChange={(value) => onUpdate('project', value || '')}
                searchable
                clearable
            />
        </Group>
    )
}
