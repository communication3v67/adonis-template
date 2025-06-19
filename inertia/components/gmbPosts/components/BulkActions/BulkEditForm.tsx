import { Group, Select, TextInput } from '@mantine/core'
import { BulkEditData, FilterOptions } from '../../types'

interface BulkEditFormProps {
    bulkEditData: BulkEditData
    filterOptions: FilterOptions
    onUpdateField: (field: keyof BulkEditData, value: string) => void
}

export const BulkEditForm = ({ bulkEditData, filterOptions, onUpdateField }: BulkEditFormProps) => {
    return (
        <>
            <Group grow>
                <Select
                    placeholder="Nouveau statut"
                    data={[
                        { value: '', label: 'Conserver le statut actuel' },
                        { value: 'Titre généré', label: 'Titre généré' },
                        { value: 'Post à générer', label: 'Post à générer' },
                        { value: 'Post généré', label: 'Post généré' },
                        { value: 'Post à publier', label: 'Post à publier' },
                        { value: 'Publié', label: 'Publié' },
                        { value: 'failed', label: 'Échec' },
                    ]}
                    value={bulkEditData.status}
                    onChange={(value) => onUpdateField('status', value || '')}
                    size="sm"
                />
                <Select
                    placeholder="Nouveau client"
                    data={[
                        { value: '', label: 'Conserver le client actuel' },
                        ...filterOptions.clients.map((client) => ({
                            value: client,
                            label: client,
                        })),
                    ]}
                    value={bulkEditData.client}
                    onChange={(value) => onUpdateField('client', value || '')}
                    size="sm"
                    searchable
                />
                <Select
                    placeholder="Nouveau projet"
                    data={[
                        { value: '', label: 'Conserver le projet actuel' },
                        ...filterOptions.projects.map((project) => ({
                            value: project,
                            label: project,
                        })),
                    ]}
                    value={bulkEditData.project_name}
                    onChange={(value) => onUpdateField('project_name', value || '')}
                    size="sm"
                    searchable
                />
                <TextInput
                    placeholder="Nouvelle ville"
                    value={bulkEditData.city}
                    onChange={(e) => onUpdateField('city', e.target.value)}
                    size="sm"
                />
            </Group>

            <Group grow>
                <TextInput
                    placeholder="Nouveau Location ID"
                    value={bulkEditData.location_id}
                    onChange={(e) => onUpdateField('location_id', e.target.value)}
                    size="sm"
                />
                <TextInput
                    placeholder="Nouveau Account ID"
                    value={bulkEditData.account_id}
                    onChange={(e) => onUpdateField('account_id', e.target.value)}
                    size="sm"
                />
                <TextInput
                    placeholder="Nouveau Notion ID"
                    value={bulkEditData.notion_id}
                    onChange={(e) => onUpdateField('notion_id', e.target.value)}
                    size="sm"
                />
            </Group>
        </>
    )
}
