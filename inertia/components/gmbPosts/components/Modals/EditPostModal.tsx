import { Badge, Button, Group, Modal, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'
import React, { useEffect, useState } from 'react'
import { LuSave, LuX } from 'react-icons/lu'
import { GmbPost, FilterOptions } from '../../types'

interface EditPostModalProps {
    post: GmbPost | null
    opened: boolean
    onClose: () => void
    filterOptions: FilterOptions
}

export const EditPostModal = ({ post, opened, onClose, filterOptions }: EditPostModalProps) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        status: '',
        text: '',
        date: '',
        image_url: '',
        link_url: '',
        keyword: '',
        client: '',
        project_name: '',
        location_id: '',
        account_id: '',
        notion_id: '',
    })

    // Garder une référence des valeurs originales
    const [originalData, setOriginalData] = useState<any>({})

    // Mettre à jour le formulaire quand le post change
    useEffect(() => {
        if (post && opened) {
            const initialData = {
                status: post.status || '',
                text: post.text || '',
                date: post.date ? new Date(post.date).toISOString().slice(0, 16) : '',
                image_url: post.image_url || '',
                link_url: post.link_url || '',
                keyword: post.keyword || '',
                client: post.client || '',
                project_name: post.project_name || '',
                location_id: post.location_id || '',
                account_id: post.account_id || '',
                notion_id: post.notion_id || '',
            }

            setData(initialData)
            setOriginalData(initialData)
        } else if (!opened) {
            reset()
            setOriginalData({})
        }
    }, [post, opened])

    // Fonction pour vérifier si un champ a été modifié
    const isFieldChanged = (fieldName: string) => {
        return data[fieldName] !== originalData[fieldName]
    }

    // Compter le nombre de champs modifiés
    const changedFieldsCount = Object.keys(data).filter((key) => isFieldChanged(key)).length

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!post) return

        // Comparer les données actuelles avec les originales
        const changedFields: any = {}
        Object.keys(data).forEach((key) => {
            if (data[key] !== originalData[key]) {
                changedFields[key] = data[key]
            }
        })

        // Vérifier s'il y a des modifications
        if (Object.keys(changedFields).length === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucune modification détectée',
                color: 'blue',
            })
            return
        }

        put(`/gmb-posts/${post.id}`, {
            onSuccess: () => {
                notifications.show({
                    title: 'Succès',
                    message: `${Object.keys(changedFields).length} champ(s) mis à jour avec succès !`,
                    color: 'green',
                })
                onClose()
                reset()
                setOriginalData({})
            },
            onError: () => {
                notifications.show({
                    title: 'Erreur',
                    message: 'Erreur lors de la mise à jour',
                    color: 'red',
                })
            },
        })
    }

    if (!post) return null

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group>
                    <Text>Modifier le post</Text>
                    {changedFieldsCount > 0 && (
                        <Badge color="orange" variant="light">
                            {changedFieldsCount} champ(s) modifié(s)
                        </Badge>
                    )}
                </Group>
            }
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Group grow>
                        <Select
                            label="Statut"
                            placeholder="Sélectionner un statut"
                            data={[
                                { value: 'Titre généré', label: 'Titre généré' },
                                { value: 'Post à générer', label: 'Post à générer' },
                                { value: 'Post généré', label: 'Post généré' },
                                { value: 'Post à publier', label: 'Post à publier' },
                                { value: 'Publié', label: 'Publié' },
                                { value: 'failed', label: 'Échec' },
                            ]}
                            value={data.status}
                            onChange={(value) => setData('status', value || '')}
                            error={errors.status}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('status') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('status') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Date"
                            type="datetime-local"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            error={errors.date}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('date') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('date') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Textarea
                        label="Texte du post"
                        placeholder="Contenu du post..."
                        resize="vertical"
                        value={data.text}
                        onChange={(e) => setData('text', e.target.value)}
                        error={errors.text}
                        minRows={3}
                        styles={{
                            input: {
                                borderColor: isFieldChanged('text') ? '#fd7e14' : undefined,
                                backgroundColor: isFieldChanged('text') ? '#fff4e6' : undefined,
                            },
                        }}
                    />

                    <Group grow>
                        <Select
                            label="Client"
                            placeholder="Sélectionner un client"
                            data={filterOptions.clients.map((client) => ({
                                value: client,
                                label: client,
                            }))}
                            value={data.client}
                            onChange={(value) => setData('client', value || '')}
                            error={errors.client}
                            searchable
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('client') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('client') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Nom du projet"
                            placeholder="Nom du projet"
                            value={data.project_name}
                            onChange={(e) => setData('project_name', e.target.value)}
                            error={errors.project_name}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('project_name') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('project_name') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            label="Mot-clé"
                            placeholder="Mot-clé principal"
                            value={data.keyword}
                            onChange={(e) => setData('keyword', e.target.value)}
                            error={errors.keyword}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('keyword') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('keyword') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="URL de l'image"
                            placeholder="https://..."
                            value={data.image_url}
                            onChange={(e) => setData('image_url', e.target.value)}
                            error={errors.image_url}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('image_url') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('image_url') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            label="URL du lien"
                            placeholder="https://..."
                            value={data.link_url}
                            onChange={(e) => setData('link_url', e.target.value)}
                            error={errors.link_url}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('link_url') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('link_url') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Location ID"
                            placeholder="ID de la localisation"
                            value={data.location_id}
                            onChange={(e) => setData('location_id', e.target.value)}
                            error={errors.location_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('location_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('location_id') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            label="Account ID"
                            placeholder="ID du compte"
                            value={data.account_id}
                            onChange={(e) => setData('account_id', e.target.value)}
                            error={errors.account_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('account_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('account_id') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Notion ID"
                            placeholder="ID Notion (optionnel)"
                            value={data.notion_id}
                            onChange={(e) => setData('notion_id', e.target.value)}
                            error={errors.notion_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('notion_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('notion_id') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose} leftSection={<LuX size={16} />}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            loading={processing}
                            disabled={changedFieldsCount === 0}
                            leftSection={<LuSave size={16} />}
                        >
                            Enregistrer {changedFieldsCount > 0 && `(${changedFieldsCount})`}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    )
}
