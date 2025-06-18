import { Button, Card, Group, Stack, Text } from '@mantine/core'
import { BulkEditData, FilterOptions } from '../../types'
import { BulkEditForm } from './BulkEditForm'

interface BulkActionBarProps {
    selectedCount: number
    bulkEditData: BulkEditData
    filterOptions: FilterOptions
    hasAnyBulkChanges: boolean
    onUpdateField: (field: keyof BulkEditData, value: string) => void
    onBulkEdit: () => void
    onBulkDelete: () => void
    onResetBulkEdit: () => void
}

export const BulkActionBar = ({
    selectedCount,
    bulkEditData,
    filterOptions,
    hasAnyBulkChanges,
    onUpdateField,
    onBulkEdit,
    onBulkDelete,
    onResetBulkEdit,
}: BulkActionBarProps) => {
    return (
        <Card withBorder p="md" bg="blue.0">
            <Stack gap="md">
                <Group justify="space-between">
                    <Text fw={500}>{selectedCount} post(s) sélectionné(s)</Text>
                    <Button
                        color="red"
                        variant="light"
                        size="sm"
                        onClick={onBulkDelete}
                    >
                        Supprimer la sélection
                    </Button>
                </Group>

                <Text size="sm" fw={500}>
                    Modifier en masse :
                </Text>

                <BulkEditForm
                    bulkEditData={bulkEditData}
                    filterOptions={filterOptions}
                    onUpdateField={onUpdateField}
                />

                <Group>
                    <Button
                        onClick={onBulkEdit}
                        size="sm"
                        disabled={!hasAnyBulkChanges}
                    >
                        Appliquer les modifications
                    </Button>
                    <Button variant="light" onClick={onResetBulkEdit} size="sm">
                        Réinitialiser
                    </Button>
                </Group>
            </Stack>
        </Card>
    )
}
