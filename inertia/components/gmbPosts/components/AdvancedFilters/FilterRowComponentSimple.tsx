import { Group, Select, TextInput, NumberInput, ActionIcon, MultiSelect } from '@mantine/core'
import { LuX } from 'react-icons/lu'
import { AdvancedFilter, FilterProperty, OPERATORS_BY_TYPE } from '../../types'

interface FilterRowComponentProps {
    filter: AdvancedFilter
    properties: FilterProperty[]
    onUpdate: (filter: AdvancedFilter) => void
    onRemove: () => void
    showRemove: boolean
}

export const FilterRowComponentSimple = ({
    filter,
    properties,
    onUpdate,
    onRemove,
    showRemove,
}: FilterRowComponentProps) => {
    const selectedProperty = properties.find(p => p.key === filter.property)
    const availableOperators = selectedProperty ? OPERATORS_BY_TYPE[selectedProperty.type] : []

    const handlePropertyChange = (property: string | null) => {
        if (!property) return
        
        const newProperty = properties.find(p => p.key === property)
        const defaultOperator = newProperty ? OPERATORS_BY_TYPE[newProperty.type][0].value : 'equals'
        
        onUpdate({
            ...filter,
            property,
            operator: defaultOperator,
            value: ''
        })
    }

    const handleOperatorChange = (operator: string | null) => {
        if (!operator) return
        
        onUpdate({
            ...filter,
            operator: operator as any,
            value: ['is_empty', 'is_not_empty'].includes(operator) ? '' : filter.value
        })
    }

    const handleValueChange = (value: any) => {
        onUpdate({
            ...filter,
            value
        })
    }

    const renderValueInput = () => {
        if (!selectedProperty) return null

        // Pour les opérateurs "est vide" et "n'est pas vide", pas besoin de champ de valeur
        if (['is_empty', 'is_not_empty'].includes(filter.operator)) {
            return null
        }

        switch (selectedProperty.type) {
            case 'text':
                return (
                    <TextInput
                        placeholder="Valeur"
                        value={filter.value as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        flex={1}
                    />
                )
            
            case 'number':
                if (filter.operator === 'between') {
                    const betweenValue = filter.value as { from: string; to: string } || { from: '', to: '' }
                    return (
                        <Group gap="xs" flex={1}>
                            <NumberInput
                                placeholder="Min"
                                value={betweenValue.from}
                                onChange={(value) => handleValueChange({
                                    ...betweenValue,
                                    from: value || ''
                                })}
                                flex={1}
                            />
                            <NumberInput
                                placeholder="Max"
                                value={betweenValue.to}
                                onChange={(value) => handleValueChange({
                                    ...betweenValue,
                                    to: value || ''
                                })}
                                flex={1}
                            />
                        </Group>
                    )
                }
                return (
                    <NumberInput
                        placeholder="Valeur"
                        value={filter.value as number}
                        onChange={(value) => handleValueChange(value)}
                        flex={1}
                    />
                )
            
            case 'select':
                if (['equals', 'not_equals'].includes(filter.operator)) {
                    return (
                        <MultiSelect
                            placeholder="Sélectionner..."
                            data={selectedProperty.options || []}
                            value={Array.isArray(filter.value) ? filter.value : [filter.value as string].filter(Boolean)}
                            onChange={handleValueChange}
                            flex={1}
                            searchable
                            clearable
                        />
                    )
                }
                return null
            
            case 'date':
                if (filter.operator === 'between') {
                    const betweenValue = filter.value as { from: string; to: string } || { from: '', to: '' }
                    return (
                        <Group gap="xs" flex={1}>
                            <TextInput
                                type="date"
                                placeholder="Date de début"
                                value={betweenValue.from}
                                onChange={(e) => handleValueChange({
                                    ...betweenValue,
                                    from: e.target.value
                                })}
                                flex={1}
                            />
                            <TextInput
                                type="date"
                                placeholder="Date de fin"
                                value={betweenValue.to}
                                onChange={(e) => handleValueChange({
                                    ...betweenValue,
                                    to: e.target.value
                                })}
                                flex={1}
                            />
                        </Group>
                    )
                }
                return (
                    <TextInput
                        type="date"
                        placeholder="Sélectionner une date"
                        value={filter.value as string}
                        onChange={(e) => handleValueChange(e.target.value)}
                        flex={1}
                    />
                )
            
            default:
                return null
        }
    }

    return (
        <Group gap="xs" align="flex-start">
            {/* Propriété */}
            <Select
                placeholder="Propriété"
                data={properties.map(p => ({ value: p.key, label: p.label }))}
                value={filter.property}
                onChange={handlePropertyChange}
                w={150}
                searchable
            />

            {/* Opérateur */}
            <Select
                placeholder="Opérateur"
                data={availableOperators}
                value={filter.operator}
                onChange={handleOperatorChange}
                w={180}
            />

            {/* Valeur */}
            {renderValueInput()}

            {/* Bouton de suppression */}
            {showRemove && (
                <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={onRemove}
                    size="sm"
                >
                    <LuX size={16} />
                </ActionIcon>
            )}
        </Group>
    )
}