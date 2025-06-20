import { Modal, Stack, Group, Button, Text, Divider } from '@mantine/core'
import { LuFilter, LuX, LuPlus } from 'react-icons/lu'
import { useState } from 'react'
import { 
    AdvancedFilterState, 
    FilterGroup, 
    AdvancedFilter,
    FilterOptions,
    FILTERABLE_PROPERTIES,
    FilterProperty,
    createDefaultAdvancedFilter
} from '../../types'
import { FilterGroupComponent } from './FilterGroupComponent'
import { generateId } from './utils'

interface AdvancedFilterModalProps {
    opened: boolean
    onClose: () => void
    filters: AdvancedFilterState
    filterOptions: FilterOptions
    onApply: (filters: AdvancedFilterState) => void
    onReset: () => void
}

export const AdvancedFilterModal = ({
    opened,
    onClose,
    filters,
    filterOptions,
    onApply,
    onReset,
}: AdvancedFilterModalProps) => {
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
        const newGroup: FilterGroup = {
            id: generateId(),
            filters: [createDefaultAdvancedFilter()],
            condition: 'and'
        }

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
        onClose()
    }

    const handleReset = () => {
        const resetFilters: AdvancedFilterState = {
            groups: [],
            isActive: false
        }
        setLocalFilters(resetFilters)
        onReset()
        onClose()
    }

    const hasActiveFilters = localFilters.groups.length > 0 && 
                           localFilters.groups.some(group => 
                               group.filters.some(filter => 
                                   filter.value !== '' && filter.value !== null && filter.value !== undefined
                               )
                           )

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <LuFilter size={20} />
                    <Text fw={600}>Filtres avancés</Text>
                </Group>
            }
            size="xl"
            centered
        >
            <Stack gap="lg">
                {/* Groupes de filtres */}
                {localFilters.groups.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        Aucun filtre configuré. Cliquez sur "Ajouter un groupe" pour commencer.
                    </Text>
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
                    
                    <Group>
                        <Button variant="default" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button onClick={handleApply}>
                            Appliquer ({localFilters.groups.reduce((acc, group) => 
                                acc + group.filters.filter(f => f.value !== '').length, 0
                            )} filtres)
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}