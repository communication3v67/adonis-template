import { Paper, Group, Button, Text, Stack, ActionIcon, Select } from '@mantine/core'
import { LuX, LuPlus } from 'react-icons/lu'
import { FilterGroup, AdvancedFilter, FilterProperty, createDefaultAdvancedFilter } from '../../types'
import { FilterRowComponentSimple } from './FilterRowComponentSimple'
import { generateId } from './utils'

interface FilterGroupComponentProps {
    group: FilterGroup
    properties: FilterProperty[]
    onUpdate: (group: FilterGroup) => void
    onRemove: () => void
    showCondition: boolean
}

export const FilterGroupComponent = ({
    group,
    properties,
    onUpdate,
    onRemove,
    showCondition,
}: FilterGroupComponentProps) => {
    const handleAddFilter = () => {
        const newFilter = createDefaultAdvancedFilter()

        onUpdate({
            ...group,
            filters: [...group.filters, newFilter]
        })
    }

    const handleUpdateFilter = (filterId: string, updatedFilter: AdvancedFilter) => {
        onUpdate({
            ...group,
            filters: group.filters.map(filter => 
                filter.id === filterId ? updatedFilter : filter
            )
        })
    }

    const handleRemoveFilter = (filterId: string) => {
        onUpdate({
            ...group,
            filters: group.filters.filter(filter => filter.id !== filterId)
        })
    }

    const handleConditionChange = (condition: string) => {
        onUpdate({
            ...group,
            condition: condition as 'and' | 'or'
        })
    }

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
                {/* En-tête du groupe */}
                <Group justify="space-between">
                    <Text size="sm" fw={500}>
                        Groupe de filtres
                    </Text>
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={onRemove}
                        size="sm"
                    >
                        <LuX size={14} />
                    </ActionIcon>
                </Group>

                {/* Filtres du groupe */}
                <Stack gap="xs">
                    {group.filters.map((filter, index) => (
                        <div key={filter.id}>
                            <FilterRowComponentSimple
                                filter={filter}
                                properties={properties}
                                onUpdate={(updatedFilter) => handleUpdateFilter(filter.id, updatedFilter)}
                                onRemove={() => handleRemoveFilter(filter.id)}
                                showRemove={group.filters.length > 1}
                            />
                            
                            {/* Condition entre les filtres du même groupe */}
                            {index < group.filters.length - 1 && (
                                <Group justify="center" my="xs">
                                    <Select
                                        data={[
                                            { value: 'and', label: 'ET' },
                                            { value: 'or', label: 'OU' }
                                        ]}
                                        value={group.condition}
                                        onChange={(value) => handleConditionChange(value || 'and')}
                                        size="xs"
                                        w={80}
                                        variant="filled"
                                    />
                                </Group>
                            )}
                        </div>
                    ))}
                </Stack>

                {/* Bouton d'ajout de filtre */}
                <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<LuPlus size={14} />}
                    onClick={handleAddFilter}
                >
                    Ajouter un filtre
                </Button>

                {/* Condition entre groupes */}
                {showCondition && (
                    <Group justify="center" mt="xs">
                        <Select
                            data={[
                                { value: 'and', label: 'ET' },
                                { value: 'or', label: 'OU' }
                            ]}
                            value={group.condition}
                            onChange={(value) => handleConditionChange(value || 'and')}
                            size="sm"
                            w={100}
                            variant="filled"
                            label="Entre ce groupe et le suivant"
                        />
                    </Group>
                )}
            </Stack>
        </Paper>
    )
}