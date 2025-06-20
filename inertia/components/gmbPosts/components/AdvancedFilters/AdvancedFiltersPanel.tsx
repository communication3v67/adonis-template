import { Stack, Group, Button, Text, Divider, Paper } from '@mantine/core'
import { LuFilter, LuX, LuPlus } from 'react-icons/lu'
import { useState } from 'react'
import { 
    AdvancedFilterState, 
    FilterGroup, 
    AdvancedFilter,
    FilterOptions,
    FILTERABLE_PROPERTIES,
    FilterProperty,
    createDefaultAdvancedFilter,
    createDefaultFilterGroup
} from '../../types'
import { FilterGroupComponent } from './FilterGroupComponent'

interface AdvancedFiltersPanelProps {
    filters: AdvancedFilterState
    filterOptions: FilterOptions
    onApply: (filters: AdvancedFilterState) => void
    onReset: () => void
}

export const AdvancedFiltersPanel = ({
    filters,
    filterOptions,
    onApply,
    onReset,
}: AdvancedFiltersPanelProps) => {
    const [localFilters, setLocalFilters] = useState<AdvancedFilterState>(filters)

    // Enrichir les propriétés avec les options du backend
    const enrichedProperties: FilterProperty[] = FILTERABLE_PROPERTIES.map(prop => {
        if (prop.type === 'select') {
            switch (prop.key) {
                case 'status':
                    return { ...prop, options: filterOptions.statuses }
                case 'client':
                    return { ...prop, options: filterOptions.clients }
                case 'project_name':
                    return { ...prop, options: filterOptions.projects }
                default:
                    return prop
            }
        }
        return prop
    })

    const handleAddGroup = () => {
        const newGroup = createDefaultFilterGroup()
        setLocalFilters(prev => ({
            ...prev,
            groups: [...prev.groups, newGroup]
        }))
    }

    const handleUpdateGroup = (groupId: string, updatedGroup: FilterGroup) => {
        setLocalFilters(prev => ({
            ...prev,
            groups: prev.groups.map(group => 
                group.id === groupId ? updatedGroup : group
            )
        }))
    }

    const handleRemoveGroup = (groupId: string) => {
        setLocalFilters(prev => ({
            ...prev,
            groups: prev.groups.filter(group => group.id !== groupId)
        }))
    }

    const handleApply = () => {
        const activeFilters = {
            ...localFilters,
            isActive: localFilters.groups.length > 0 && 
                     localFilters.groups.some(group => 
                         group.filters.some(filter => 
                             filter.value !== '' && filter.value !== null && filter.value !== undefined
                         )
                     )
        }
        onApply(activeFilters)
    }

    const handleReset = () => {
        const resetFilters: AdvancedFilterState = {
            groups: [],
            isActive: false
        }
        setLocalFilters(resetFilters)
        onReset()
    }

    const hasActiveFilters = localFilters.groups.length > 0 && 
                           localFilters.groups.some(group => 
                               group.filters.some(filter => 
                                   filter.value !== '' && filter.value !== null && filter.value !== undefined
                               )
                           )

    const activeFiltersCount = localFilters.groups.reduce((acc, group) => 
        acc + group.filters.filter(filter => 
            filter.value !== '' && filter.value !== null && filter.value !== undefined
        ).length, 0
    )

    return (
        <Stack gap="md">
            {/* Description */}
            <Text size="sm" c="dimmed">
                Créez des filtres complexes avec des conditions multiples, similaires à ceux de Notion.
            </Text>
            
            <Divider />

            {/* Groupes de filtres */}
            {localFilters.groups.length === 0 ? (
                <Paper p="md" bg="gray.0" radius="md" style={{ border: '2px dashed var(--mantine-color-gray-3)' }}>
                    <Stack align="center" gap="xs">
                        <Text c="dimmed" ta="center" size="sm">
                            Aucun filtre configuré
                        </Text>
                        <Text c="dimmed" ta="center" size="xs">
                            Cliquez sur "Ajouter un groupe" pour commencer
                        </Text>
                    </Stack>
                </Paper>
            ) : (
                <Stack gap="md">
                    {localFilters.groups.map((group, index) => (
                        <div key={group.id}>
                            <FilterGroupComponent
                                group={group}
                                properties={enrichedProperties}
                                onUpdate={(updatedGroup) => handleUpdateGroup(group.id, updatedGroup)}
                                onRemove={() => handleRemoveGroup(group.id)}
                                showCondition={index < localFilters.groups.length - 1}
                            />
                            
                            {index < localFilters.groups.length - 1 && (
                                <Divider 
                                    label={
                                        <Text size="sm" fw={500} c="blue">
                                            {group.condition.toUpperCase()}
                                        </Text>
                                    } 
                                    labelPosition="center" 
                                    my="md"
                                />
                            )}
                        </div>
                    ))}
                </Stack>
            )}

            {/* Bouton d'ajout de groupe */}
            <Button
                variant="light"
                leftSection={<LuPlus size={16} />}
                onClick={handleAddGroup}
                fullWidth
            >
                Ajouter un groupe de filtres
            </Button>

            <Divider />

            {/* Actions */}
            <Group justify="space-between">
                <Button
                    variant="subtle"
                    leftSection={<LuX size={16} />}
                    onClick={handleReset}
                    disabled={!hasActiveFilters}
                >
                    Réinitialiser
                </Button>
                
                <Button 
                    leftSection={<LuFilter size={16} />}
                    onClick={handleApply}
                    disabled={!hasActiveFilters}
                >
                    Appliquer {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
            </Group>

            {/* Info */}
            {hasActiveFilters && (
                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                    💡 Les filtres avancés sont appliqués en plus des filtres de base
                </Text>
            )}
        </Stack>
    )
}