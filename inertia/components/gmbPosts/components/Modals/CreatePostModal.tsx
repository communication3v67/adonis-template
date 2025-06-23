import { Modal, Stack, Group, Button, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@inertiajs/react'
import { useState } from 'react'
import { LuSave, LuX } from 'react-icons/lu'
import { FilterOptions } from '../../types'
import { CreatableSelect } from '../CreatableSelect'

interface CreatePostModalProps {
    opened: boolean
    onClose: () => void
    filterOptions: FilterOptions
}

export const CreatePostModal = ({
    opened,
    onClose,
    filterOptions,
}: CreatePostModalProps) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        status: 'Post à générer',
        text: '',
        date: new Date().toISOString().slice(0, 16),
        image_url: '',
        link_url: '',
        keyword: '',
        client: '',
        project_name: '',
        city: '',
        location_id: '',
        account_id: '',
        notion_id: '',
        informations: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/gmb-posts', {
            onSuccess: () => {
                console.log('Post créé avec succès')
                onClose()
                reset()
                // Rafraîchir la page pour voir le nouveau post
                window.location.reload()
            },
            onError: (errors) => {
                console.error('Erreur création post:', errors)
            }
        })
    }

    const handleClose = () => {
        onClose()
        reset()
    }

    // Options pour le statut
    const [statusOptions, setStatusOptions] = useState([
        { value: 'Post à générer', label: 'Post à générer' },
        { value: 'Brouillon', label: 'Brouillon' },
        { value: 'Publié', label: 'Publié' },
        { value: 'Programmé', label: 'Programmé' },
        { value: 'Échec', label: 'Échec' },
    ])

    // Options pour les clients
    const [clientOptions, setClientOptions] = useState(
        filterOptions.clients.map(client => ({ value: client, label: client }))
    )

    // Options pour les projets
    const [projectOptions, setProjectOptions] = useState(
        filterOptions.projects.map(project => ({ value: project, label: project }))
    )

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Créer un nouveau post GMB"
            size="lg"
            centered
        >
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    {/* Statut et Date */}
                    <Group grow>
                        <CreatableSelect
                            label="Statut"
                            placeholder="Sélectionner un statut"
                            data={statusOptions}
                            value={data.status}
                            onChange={(value) => setData('status', value || '')}
                            onCreate={(query) => {
                                const newOption = { value: query, label: query }
                                setStatusOptions(prev => [...prev, newOption])
                                setData('status', query)
                            }}
                            error={errors.status}
                            required
                        />
                        <TextInput
                            label="Date"
                            type="datetime-local"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            error={errors.date}
                            required
                        />
                    </Group>

                    {/* Texte du post */}
                    <Textarea
                        label="Texte du post"
                        placeholder="Contenu du post..."
                        value={data.text}
                        onChange={(e) => setData('text', e.target.value)}
                        error={errors.text}
                        minRows={4}
                        required
                    />

                    {/* Informations supplémentaires */}
                    <Textarea
                        label="Informations supplémentaires"
                        placeholder="Ajoutez des informations sur ce post (optionnel)..."
                        value={data.informations}
                        onChange={(e) => setData('informations', e.target.value)}
                        error={errors.informations}
                        minRows={3}
                    />

                    {/* Client et Projet */}
                    <Group grow>
                        <CreatableSelect
                            label="Client"
                            placeholder="Sélectionner un client"
                            data={clientOptions}
                            value={data.client}
                            onChange={(value) => setData('client', value || '')}
                            onCreate={(query) => {
                                const newOption = { value: query, label: query }
                                setClientOptions(prev => [...prev, newOption])
                                setData('client', query)
                            }}
                            error={errors.client}
                            required
                        />
                        <CreatableSelect
                            label="Projet"
                            placeholder="Sélectionner un projet"
                            data={projectOptions}
                            value={data.project_name}
                            onChange={(value) => setData('project_name', value || '')}
                            onCreate={(query) => {
                                const newOption = { value: query, label: query }
                                setProjectOptions(prev => [...prev, newOption])
                                setData('project_name', query)
                            }}
                            error={errors.project_name}
                            required
                        />
                    </Group>

                    {/* Mot-clé et Ville */}
                    <Group grow>
                        <TextInput
                            label="Mot-clé"
                            placeholder="Mot-clé principal"
                            value={data.keyword}
                            onChange={(e) => setData('keyword', e.target.value)}
                            error={errors.keyword}
                        />
                        <TextInput
                            label="Ville"
                            placeholder="Ville"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            error={errors.city}
                        />
                    </Group>

                    {/* URLs */}
                    <Group grow>
                        <TextInput
                            label="URL de l'image"
                            placeholder="https://..."
                            value={data.image_url}
                            onChange={(e) => setData('image_url', e.target.value)}
                            error={errors.image_url}
                        />
                        <TextInput
                            label="URL du lien"
                            placeholder="https://..."
                            value={data.link_url}
                            onChange={(e) => setData('link_url', e.target.value)}
                            error={errors.link_url}
                        />
                    </Group>

                    {/* IDs */}
                    <Group grow>
                        <TextInput
                            label="Location ID"
                            placeholder="ID de la localisation"
                            value={data.location_id}
                            onChange={(e) => setData('location_id', e.target.value)}
                            error={errors.location_id}
                            required
                        />
                        <TextInput
                            label="Account ID"
                            placeholder="ID du compte"
                            value={data.account_id}
                            onChange={(e) => setData('account_id', e.target.value)}
                            error={errors.account_id}
                            required
                        />
                    </Group>

                    {/* Notion ID */}
                    <TextInput
                        label="Notion ID"
                        placeholder="ID Notion (optionnel)"
                        value={data.notion_id}
                        onChange={(e) => setData('notion_id', e.target.value)}
                        error={errors.notion_id}
                    />

                    {/* Actions */}
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="light"
                            onClick={handleClose}
                            leftSection={<LuX size={16} />}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            loading={processing}
                            leftSection={<LuSave size={16} />}
                        >
                            Créer le post
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    )
}