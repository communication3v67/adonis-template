import { Button, Card, Group, Stack, Text } from '@mantine/core'
import { LuSearch, LuX } from 'react-icons/lu'
import { FilterState, FilterOptions } from '../../types'
import { SearchInput } from './SearchInput'
import { FilterDropdowns } from './FilterDropdowns'
import { DateFilters } from './DateFilters'
import { QuickFilters } from './QuickFilters'
import { FilterBadges } from './FilterBadges'

interface FilterSectionProps {
    filters: FilterState
    filterOptions: FilterOptions
    totalResults: number
    isApplyingFilters: boolean
    onUpdateFilter: (key: keyof FilterState, value: string) => void
    onUpdateDateRange: (dateFrom: string, dateTo: string) => void
    onApplyFilters: () => void
    onResetFilters: () => void
    onRemoveFilter: (key: keyof FilterState) => void
}

export const FilterSection = ({
    filters,
    filterOptions,
    totalResults,
    isApplyingFilters,
    onUpdateFilter,
    onUpdateDateRange,
    onApplyFilters,
    onResetFilters,
    onRemoveFilter,
}: FilterSectionProps) => {
    const handleRemoveFilter = (key: keyof FilterState) => {
        if (key === 'dateFrom') {
            onUpdateDateRange('', '')
        } else {
            onUpdateFilter(key, '')
        }
    }

    return (
        <Card withBorder p="md">
            <Stack gap="md">
                {/* En-tête avec badges des filtres actifs */}
                <Group justify="space-between">
                    <Text fw={500}>Filtres</Text>
                    <Group gap="xs">
                        <FilterBadges filters={filters} onRemoveFilter={handleRemoveFilter} />
                    </Group>
                </Group>

                {/* Champ de recherche */}
                <SearchInput
                    value={filters.search}
                    onChange={(value) => onUpdateFilter('search', value)}
                    onEnterKey={onApplyFilters}
                />

                {/* Filtres par dropdowns */}
                <FilterDropdowns
                    filters={filters}
                    filterOptions={filterOptions}
                    onUpdate={onUpdateFilter}
                />

                {/* Filtres de date */}
                <DateFilters
                    filters={filters}
                    onUpdate={onUpdateFilter}
                    onUpdateRange={onUpdateDateRange}
                />

                {/* Résultats et note d'aide */}
                <Group>
                    <Text size="sm" c="dimmed">
                        {totalResults} résultat{totalResults > 1 ? 's' : ''}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                        💡 Cliquez sur les en-têtes de colonnes pour trier
                    </Text>
                </Group>

                {/* Boutons d'action */}
                <Group>
                    <Button
                        onClick={onApplyFilters}
                        leftSection={<LuSearch size={16} />}
                        variant="filled"
                        loading={isApplyingFilters}
                    >
                        {isApplyingFilters ? 'Application...' : 'Appliquer manuellement'}
                    </Button>
                    <Button
                        variant="light"
                        onClick={onResetFilters}
                        leftSection={<LuX size={16} />}
                    >
                        Réinitialiser
                    </Button>
                </Group>

                {/* Filtres rapides */}
                <QuickFilters
                    onUpdateFilter={onUpdateFilter}
                    onUpdateDateRange={onUpdateDateRange}
                />

                {/* Note d'auto-application */}
                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                    💡 Les filtres s'appliquent automatiquement (recherche : 0.8s)
                </Text>
            </Stack>
        </Card>
    )
}
