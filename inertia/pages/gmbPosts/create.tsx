import { Head, Link, useForm } from '@inertiajs/react'
import {
    Button,
    Card,
    Group,
    Select,
    Stack,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core'
import { LuArrowLeft, LuSave } from 'react-icons/lu'
import AppLayout from '../../layouts/app-layout/app-layout'

interface Props {
    clients: string[]
    projects: Array<{
        project_name: string
        client: string
    }>
}

export default function CreateGmbPost({ clients, projects }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        status: 'draft',
        text: '',
        date: new Date().toISOString().slice(0, 16),
        image_url: '',
        link_url: '',
        keyword: '',
        client: '',
        project_name: '',
        location_id: '',
        account_id: '',
        notion_id: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/gmb-posts')
    }

    return (
        <AppLayout>
            <Head title="Créer un post GMB" />

            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Title order={2}>Créer un post GMB</Title>
                    <Button
                        component={Link}
                        href="/gmb-posts"
                        variant="light"
                        leftSection={<LuArrowLeft size={16} />}
                    >
                        Retour à la liste
                    </Button>
                </Group>

                <Card withBorder>
                    <form onSubmit={handleSubmit}>
                        <Stack gap="md">
                            <Group grow>
                                <Select
                                    label="Statut"
                                    placeholder="Sélectionner un statut"
                                    data={[
                                        { value: 'draft', label: 'Brouillon' },
                                        { value: 'published', label: 'Publié' },
                                        { value: 'scheduled', label: 'Programmé' },
                                        { value: 'failed', label: 'Échec' },
                                    ]}
                                    value={data.status}
                                    onChange={(value) => setData('status', value || '')}
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

                            <Textarea
                                label="Texte du post"
                                placeholder="Contenu du post..."
                                value={data.text}
                                onChange={(e) => setData('text', e.target.value)}
                                error={errors.text}
                                minRows={4}
                                required
                            />

                            <Group grow>
                                <Select
                                    label="Client"
                                    placeholder="Sélectionner un client"
                                    data={clients.map(client => ({ value: client, label: client }))}
                                    value={data.client}
                                    onChange={(value) => setData('client', value || '')}
                                    error={errors.client}
                                    searchable
                                    required
                                />
                                <TextInput
                                    label="Nom du projet"
                                    placeholder="Nom du projet"
                                    value={data.project_name}
                                    onChange={(e) => setData('project_name', e.target.value)}
                                    error={errors.project_name}
                                    required
                                />
                            </Group>

                            <Group grow>
                                <TextInput
                                    label="Mot-clé"
                                    placeholder="Mot-clé principal"
                                    value={data.keyword}
                                    onChange={(e) => setData('keyword', e.target.value)}
                                    error={errors.keyword}
                                />
                                <TextInput
                                    label="URL de l'image"
                                    placeholder="https://..."
                                    value={data.image_url}
                                    onChange={(e) => setData('image_url', e.target.value)}
                                    error={errors.image_url}
                                />
                            </Group>

                            <Group grow>
                                <TextInput
                                    label="URL du lien"
                                    placeholder="https://..."
                                    value={data.link_url}
                                    onChange={(e) => setData('link_url', e.target.value)}
                                    error={errors.link_url}
                                />
                                <TextInput
                                    label="Location ID"
                                    placeholder="ID de la localisation"
                                    value={data.location_id}
                                    onChange={(e) => setData('location_id', e.target.value)}
                                    error={errors.location_id}
                                    required
                                />
                            </Group>

                            <Group grow>
                                <TextInput
                                    label="Account ID"
                                    placeholder="ID du compte"
                                    value={data.account_id}
                                    onChange={(e) => setData('account_id', e.target.value)}
                                    error={errors.account_id}
                                    required
                                />
                                <TextInput
                                    label="Notion ID"
                                    placeholder="ID Notion (optionnel)"
                                    value={data.notion_id}
                                    onChange={(e) => setData('notion_id', e.target.value)}
                                    error={errors.notion_id}
                                />
                            </Group>

                            <Group justify="flex-end" mt="md">
                                <Button
                                    component={Link}
                                    href="/gmb-posts"
                                    variant="light"
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
                </Card>
            </Stack>
        </AppLayout>
    )
}
