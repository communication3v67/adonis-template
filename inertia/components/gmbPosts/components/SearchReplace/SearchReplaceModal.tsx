import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Checkbox,
    Divider,
    Group,
    Modal,
    Paper,
    ScrollArea,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Tooltip,
} from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { LuCircleAlert, LuEye, LuEyeOff, LuReplace, LuSearch } from 'react-icons/lu'
import { GmbPost } from '../../types'

interface SearchReplaceModalProps {
    opened: boolean
    onClose: () => void
    posts: GmbPost[]
    selectedPosts: number[]
    onReplace: (replacements: { postId: number; field: string; newValue: string }[]) => void
}

// Champs disponibles pour la recherche/remplacement
const SEARCHABLE_FIELDS = [
    { value: 'text', label: 'Texte', default: true },
    { value: 'keyword', label: 'Mot-clé', default: true },
    { value: 'client', label: 'Client', default: true },
    { value: 'project_name', label: 'Projet', default: true },
    { value: 'image_url', label: "URL de l'image", default: false },
    { value: 'link_url', label: 'Lien', default: false },
    { value: 'city', label: 'Ville', default: true },
    { value: 'location_id', label: 'Location ID', default: false },
    { value: 'account_id', label: 'Account ID', default: false },
    { value: 'informations', label: 'Informations', default: false },
]

export function SearchReplaceModal({
    opened,
    onClose,
    posts,
    selectedPosts,
    onReplace,
}: SearchReplaceModalProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [replaceTerm, setReplaceTerm] = useState('')
    const [selectedFields, setSelectedFields] = useState<string[]>(
        SEARCHABLE_FIELDS.filter((f) => f.default).map((f) => f.value)
    )
    const [caseSensitive, setCaseSensitive] = useState(false)
    const [wholeWord, setWholeWord] = useState(false)
    const [previewMode, setPreviewMode] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)

    // Réinitialiser lors de l'ouverture
    useEffect(() => {
        if (opened) {
            setSearchTerm('')
            setReplaceTerm('')
            setPreviewMode(true)
            setIsProcessing(false)
        }
    }, [opened])

    // Filtrer les posts selon la sélection
    const postsToProcess = useMemo(() => {
        if (selectedPosts.length > 0) {
            return posts.filter((post) => selectedPosts.includes(post.id))
        }
        return posts
    }, [posts, selectedPosts])

    // Fonction de recherche
    const searchInText = (text: string, search: string): boolean => {
        if (!text || !search) return false

        const flags = caseSensitive ? 'g' : 'gi'
        const pattern = wholeWord ? `\\b${search}\\b` : search

        try {
            const regex = new RegExp(pattern, flags)
            return regex.test(text)
        } catch {
            // Si la regex est invalide, faire une recherche simple
            if (caseSensitive) {
                return text.includes(search)
            }
            return text.toLowerCase().includes(search.toLowerCase())
        }
    }

    // Fonction de remplacement
    const replaceInText = (text: string, search: string, replace: string): string => {
        if (!text || !search) return text

        const flags = caseSensitive ? 'g' : 'gi'
        const pattern = wholeWord ? `\\b${search}\\b` : search

        try {
            const regex = new RegExp(pattern, flags)
            return text.replace(regex, replace)
        } catch {
            // Si la regex est invalide, faire un remplacement simple
            if (caseSensitive) {
                return text.split(search).join(replace)
            }
            // Remplacement insensible à la casse
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
            return text.replace(regex, replace)
        }
    }

    // Calculer les correspondances et prévisualisation
    const matches = useMemo(() => {
        if (!searchTerm) return []

        const results: Array<{
            postId: number
            post: GmbPost
            fields: Array<{
                field: string
                originalValue: string
                newValue: string
                hasMatch: boolean
            }>
        }> = []

        postsToProcess.forEach((post) => {
            const fieldMatches: Array<{
                field: string
                originalValue: string
                newValue: string
                hasMatch: boolean
            }> = []

            selectedFields.forEach((field) => {
                const value = post[field as keyof GmbPost] as string
                if (value && typeof value === 'string') {
                    const hasMatch = searchInText(value, searchTerm)
                    if (hasMatch) {
                        fieldMatches.push({
                            field,
                            originalValue: value,
                            newValue: replaceInText(value, searchTerm, replaceTerm),
                            hasMatch: true,
                        })
                    }
                }
            })

            if (fieldMatches.length > 0) {
                results.push({
                    postId: post.id,
                    post,
                    fields: fieldMatches,
                })
            }
        })

        return results
    }, [postsToProcess, selectedFields, searchTerm, replaceTerm, caseSensitive, wholeWord])

    // Compter le nombre total de remplacements
    const totalReplacements = matches.reduce((acc, match) => acc + match.fields.length, 0)

    // Gérer le remplacement
    const handleReplace = () => {
        if (!searchTerm || matches.length === 0) return

        setIsProcessing(true)

        const replacements = matches.flatMap((match) =>
            match.fields.map((field) => ({
                postId: match.postId,
                field: field.field,
                newValue: field.newValue,
            }))
        )

        onReplace(replacements)
        setIsProcessing(false)
        onClose()
    }

    // Basculer la sélection d'un champ
    const toggleField = (field: string) => {
        setSelectedFields((prev) =>
            prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
        )
    }

    // Sélectionner/désélectionner tous les champs
    const toggleAllFields = () => {
        if (selectedFields.length === SEARCHABLE_FIELDS.length) {
            setSelectedFields([])
        } else {
            setSelectedFields(SEARCHABLE_FIELDS.map((f) => f.value))
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <LuReplace size={20} />
                    <Text fw={600}>Rechercher et remplacer</Text>
                </Group>
            }
            size="xl"
        >
            <Stack gap="md">
                {/* Informations sur la sélection */}
                <Alert icon={<LuCircleAlert size={16} />} color="blue" variant="light">
                    {selectedPosts.length > 0
                        ? `${selectedPosts.length} post(s) sélectionné(s) pour le traitement`
                        : `Tous les posts visibles (${postsToProcess.length}) seront traités`}
                </Alert>

                {/* Champs de recherche et remplacement */}
                <Stack gap="xs">
                    <TextInput
                        label="Rechercher"
                        placeholder="Texte à rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        leftSection={<LuSearch size={16} />}
                    />
                    <TextInput
                        label="Remplacer par"
                        placeholder="Nouveau texte..."
                        value={replaceTerm}
                        onChange={(e) => setReplaceTerm(e.currentTarget.value)}
                        leftSection={<LuReplace size={16} />}
                    />
                </Stack>

                {/* Options de recherche */}
                <Group gap="lg">
                    <Checkbox
                        label="Respecter la casse"
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.currentTarget.checked)}
                    />
                    <Checkbox
                        label="Mot entier uniquement"
                        checked={wholeWord}
                        onChange={(e) => setWholeWord(e.currentTarget.checked)}
                    />
                </Group>

                {/* Sélection des champs */}
                <Paper p="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>
                            Champs à traiter
                        </Text>
                        <Button size="xs" variant="subtle" onClick={toggleAllFields}>
                            {selectedFields.length === SEARCHABLE_FIELDS.length
                                ? 'Désélectionner tout'
                                : 'Sélectionner tout'}
                        </Button>
                    </Group>
                    <SimpleGrid cols={3} spacing="xs">
                        {SEARCHABLE_FIELDS.map((field) => (
                            <Checkbox
                                key={field.value}
                                label={field.label}
                                checked={selectedFields.includes(field.value)}
                                onChange={() => toggleField(field.value)}
                            />
                        ))}
                    </SimpleGrid>
                </Paper>

                {/* Résumé et prévisualisation */}
                {searchTerm && (
                    <>
                        <Divider />

                        <Group justify="space-between">
                            <Text size="sm">
                                <Text span fw={600}>
                                    {matches.length}
                                </Text>{' '}
                                post(s) avec{' '}
                                <Text span fw={600}>
                                    {totalReplacements}
                                </Text>{' '}
                                correspondance(s)
                            </Text>
                            <Tooltip label={previewMode ? "Masquer l'aperçu" : "Afficher l'aperçu"}>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => setPreviewMode(!previewMode)}
                                >
                                    {previewMode ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                                </ActionIcon>
                            </Tooltip>
                        </Group>

                        {/* Prévisualisation des changements */}
                        {previewMode && matches.length > 0 && (
                            <ScrollArea h={300} type="scroll">
                                <Stack gap="md">
                                    {matches.map((match) => (
                                        <Paper key={match.postId} p="sm" withBorder>
                                            <Group justify="space-between" mb="xs">
                                                <Text size="sm" fw={500}>
                                                    Post #{match.postId} - {match.post.client}
                                                </Text>
                                                <Badge size="sm" variant="light">
                                                    {match.fields.length} champ(s)
                                                </Badge>
                                            </Group>
                                            <Stack gap="xs">
                                                {match.fields.map((field, idx) => (
                                                    <div
                                                        key={`${match.postId}-${field.field}-${idx}`}
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c="dimmed"
                                                            tt="uppercase"
                                                            mb={2}
                                                        >
                                                            {SEARCHABLE_FIELDS.find(
                                                                (f) => f.value === field.field
                                                            )?.label || field.field}
                                                        </Text>
                                                        <Paper p="xs" bg="gray.0">
                                                            <Text
                                                                size="xs"
                                                                style={{
                                                                    textDecoration: 'line-through',
                                                                }}
                                                                c="red.6"
                                                            >
                                                                {field.originalValue.substring(
                                                                    0,
                                                                    100
                                                                )}
                                                                {field.originalValue.length > 100 &&
                                                                    '...'}
                                                            </Text>
                                                            <Text size="xs" c="green.6" mt={4}>
                                                                {field.newValue.substring(0, 100)}
                                                                {field.newValue.length > 100 &&
                                                                    '...'}
                                                            </Text>
                                                        </Paper>
                                                    </div>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </ScrollArea>
                        )}
                    </>
                )}

                {/* Boutons d'action */}
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        leftSection={<LuReplace size={16} />}
                        onClick={handleReplace}
                        disabled={!searchTerm || matches.length === 0 || isProcessing}
                        loading={isProcessing}
                    >
                        Remplacer {totalReplacements > 0 && `(${totalReplacements})`}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
