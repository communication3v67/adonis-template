import { Button, Card, Group, Stack, Text, Accordion, Badge, Divider } from '@mantine/core'
import { LuSearch, LuX, LuFilter, LuSettings } from 'react-icons/lu'
import { FilterState, FilterOptions } from '../../types'
import { SearchInput } from './SearchInput'
import { FilterDropdowns } from './FilterDropdowns'
import { DateFilters } from './DateFilters'
import { QuickFilters } from './QuickFilters'
import { FilterBadges } from './FilterBadges'
import { AdvancedFiltersPanel } from '../AdvancedFilters'
import { useAdvancedFilters } from '../../hooks/useAdvancedFilters'

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
    const {
        advancedFilters,
        activeFiltersCount,
        hasActiveAdvancedFilters,
        applyAdvancedFilters,
        resetAdvancedFilters
    } = useAdvancedFilters(filters)

    const handleRemoveFilter = (key: keyof FilterState) => {
        if (key === 'dateFrom') {
            onUpdateDateRange('', '')
        } else {
            onUpdateFilter(key, '')
        }
    }

    return (
        <>
            <Card withBorder p="md">
                <Stack gap="md">
                    {/* En-tête avec badges des filtres actifs */}
                    <Group justify="space-between">
                        <Text fw={500}>Filtres</Text>
                        <Group gap="xs">
                            <FilterBadges filters={filters} onRemoveFilter={handleRemoveFilter} />
                            {hasActiveAdvancedFilters && (
                                <Badge 
                                    variant="light" 
                                    color="blue" 
                                    leftSection={<LuFilter size={12} />}
                                >
                                    {activeFiltersCount} filtres avancés
                                </Badge>
                            )}
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

                    {/* Accordéon pour les filtres avancés */}
                    <Accordion variant="separated" defaultValue={null}>
                        <Accordion.Item value="advanced-filters">
                            <Accordion.Control 
                                icon={<LuSettings size={16} />}
                                style={{ 
                                    borderRadius: '8px',
                                    backgroundColor: hasActiveAdvancedFilters ? 'var(--mantine-color-blue-0)' : undefined
                                }}
                            >
                                <Group justify="space-between" pr="md">
                                    <Text fw={500}>Filtres avancés</Text>
                                    {hasActiveAdvancedFilters && (
                                        <Badge size="sm" variant="filled" color="blue">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <AdvancedFiltersPanel
                                    filters={advancedFilters}
                                    filterOptions={filterOptions}
                                    onApply={applyAdvancedFilters}
                                    onReset={resetAdvancedFilters}
                                />
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </Stack>
            </Card>
        </>
    )
}
