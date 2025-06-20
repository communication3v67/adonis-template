import { Button, Card, Group, Stack, Text } from '@mantine/core'
import { LuCamera } from 'react-icons/lu'
import { useState } from 'react'
import { BulkEditData, FilterOptions } from '../../types'
import { BulkEditForm } from './BulkEditForm'
import { BulkImageUpload } from './BulkImageUpload'

interface BulkActionBarProps {
    selectedCount: number
    selectedPosts?: Array<{ id: number; image_url?: string }> // Rendre optionnel
    bulkEditData: BulkEditData
    filterOptions: FilterOptions
    hasAnyBulkChanges: boolean
    onUpdateField: (field: keyof BulkEditData, value: string | string[]) => void
    onBulkEdit: () => void
    onBulkDelete: () => void
    onResetBulkEdit: () => void
    onBulkImages: (images: string[], overwriteExisting: boolean) => void
}

export const BulkActionBar = ({
    selectedCount,
    selectedPosts = [], // Valeur par défaut
    bulkEditData,
    filterOptions,
    hasAnyBulkChanges,
    onUpdateField,
    onBulkEdit,
    onBulkDelete,
    onResetBulkEdit,
    onBulkImages,
}: BulkActionBarProps) => {
    const [showImageUpload, setShowImageUpload] = useState(false)

    const handleApplyImages = (images: string[], overwriteExisting: boolean) => {
        onBulkImages(images, overwriteExisting)
        setShowImageUpload(false)
    }
    return (
        <>
            {/* Upload d'images en masse */}
            <BulkImageUpload
                selectedCount={selectedCount}
                selectedPosts={selectedPosts}
                onApplyImages={handleApplyImages}
                onClose={() => setShowImageUpload(false)}
                visible={showImageUpload}
            />
            
            <Card withBorder p="md" bg="blue.0">
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={500}>{selectedCount} post(s) sélectionné(s)</Text>
                        <Group gap="xs">
                            <Button
                                leftSection={<LuCamera size={16} />}
                                color="orange"
                                variant="light"
                                size="sm"
                                onClick={() => setShowImageUpload(true)}
                            >
                                Attribuer des images
                            </Button>
                            <Button
                                color="red"
                                variant="light"
                                size="sm"
                                onClick={onBulkDelete}
                            >
                                Supprimer la sélection
                            </Button>
                        </Group>
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
        </>
    )
}
