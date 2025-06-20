import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Checkbox,
    Group,
    Stack,
    Text,
    Textarea,
    Tooltip,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { LuAccessibility, LuCamera, LuCheck, LuInfo, LuX } from 'react-icons/lu'

interface BulkImageUploadProps {
    selectedCount: number
    selectedPosts?: Array<{ id: number; image_url?: string }> // Ajout des données des posts
    onApplyImages: (images: string[], overwriteExisting: boolean) => void
    onClose: () => void
    visible: boolean
}

export const BulkImageUpload = ({
    selectedCount,
    selectedPosts = [],
    onApplyImages,
    onClose,
    visible,
}: BulkImageUploadProps) => {
    const [imageUrls, setImageUrls] = useState('')
    const [parsedUrls, setParsedUrls] = useState<string[]>([])
    const [validUrls, setValidUrls] = useState<string[]>([])
    const [invalidUrls, setInvalidUrls] = useState<string[]>([])
    const [dropboxConversions, setDropboxConversions] = useState<string[]>([])
    const [overwriteExisting, setOverwriteExisting] = useState(false)

    // Validation et transformation d'URL
    const processUrl = (
        url: string
    ): { isValid: boolean; processedUrl: string; wasDropboxConverted: boolean } => {
        try {
            const urlObj = new URL(url.trim())
            let processedUrl = url.trim()
            let wasDropboxConverted = false

            // Gérer les URLs Dropbox
            if (urlObj.hostname === 'www.dropbox.com' || urlObj.hostname === 'dropbox.com') {
                const urlParams = new URLSearchParams(urlObj.search)

                // Vérifier si c'est un lien de partage Dropbox
                if (urlObj.pathname.includes('/scl/fi/') || urlObj.pathname.includes('/s/')) {
                    // Changer dl=0 en dl=1 pour le téléchargement direct
                    if (urlParams.get('dl') === '0') {
                        urlParams.set('dl', '1')
                        urlObj.search = urlParams.toString()
                        processedUrl = urlObj.toString()
                        wasDropboxConverted = true
                    } else if (!urlParams.has('dl')) {
                        // Ajouter dl=1 si le paramètre n'existe pas
                        urlParams.set('dl', '1')
                        urlObj.search = urlParams.toString()
                        processedUrl = urlObj.toString()
                        wasDropboxConverted = true
                    }

                    return { isValid: true, processedUrl, wasDropboxConverted }
                }
            }

            // Validation pour les autres URLs (formats d'image classiques)
            const isImageUrl =
                ['http:', 'https:'].includes(urlObj.protocol) &&
                /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(urlObj.pathname + urlObj.search)

            return { isValid: isImageUrl, processedUrl, wasDropboxConverted }
        } catch {
            return { isValid: false, processedUrl: url, wasDropboxConverted: false }
        }
    }

    // Parser et valider les URLs
    useEffect(() => {
        if (!imageUrls.trim()) {
            setParsedUrls([])
            setValidUrls([])
            setInvalidUrls([])
            setDropboxConversions([])
            return
        }

        const urls = imageUrls
            .split('\n')
            .map((url) => url.trim())
            .filter((url) => url.length > 0)

        setParsedUrls(urls)

        const valid: string[] = []
        const invalid: string[] = []
        const converted: string[] = []

        urls.forEach((url) => {
            const result = processUrl(url)
            if (result.isValid) {
                valid.push(result.processedUrl)
                if (result.wasDropboxConverted) {
                    converted.push(url) // Garder l'URL originale pour l'affichage
                }
            } else {
                invalid.push(url)
            }
        })

        setValidUrls(valid)
        setInvalidUrls(invalid)
        setDropboxConversions(converted)
    }, [imageUrls])

    const handleApply = () => {
        if (validUrls.length > 0) {
            onApplyImages(validUrls, overwriteExisting)
            onClose()
            setImageUrls('')
        }
    }

    const handleClear = () => {
        setImageUrls('')
    }

    // Réinitialiser quand le composant devient invisible
    useEffect(() => {
        if (!visible) {
            setImageUrls('')
        }
    }, [visible])

    if (!visible) return null

    const urlsNeeded = selectedCount
    const urlsProvided = validUrls.length
    const urlsShortage = Math.max(0, urlsNeeded - urlsProvided)
    const urlsExcess = Math.max(0, urlsProvided - urlsNeeded)

    // Détecter les posts avec des images existantes
    const postsWithImages = (selectedPosts || []).filter(
        (post) => post && post.image_url && post.image_url.trim() !== ''
    )
    const hasPostsWithImages = postsWithImages.length > 0
    const shouldShowOverwriteWarning = hasPostsWithImages && !overwriteExisting

    return (
        <Card withBorder p="md" bg="orange.0" style={{ marginBottom: '1rem' }}>
            <Stack gap="md">
                {/* En-tête */}
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <LuCamera size={20} color="orange" />
                        <Text fw={500} c="orange.8">
                            Attribution d'images en masse
                        </Text>
                    </Group>
                    <ActionIcon variant="subtle" color="gray" onClick={onClose} size="sm">
                        <LuX size={16} />
                    </ActionIcon>
                </Group>

                {/* Statistiques */}
                <Group gap="md">
                    <Badge variant="filled" color="blue" size="sm">
                        {selectedCount} posts sélectionnés
                    </Badge>
                    {validUrls.length > 0 && (
                        <Badge variant="filled" color="green" size="sm">
                            {validUrls.length} images valides
                        </Badge>
                    )}
                    {invalidUrls.length > 0 && (
                        <Badge variant="filled" color="red" size="sm">
                            {invalidUrls.length} URLs invalides
                        </Badge>
                    )}
                    {dropboxConversions.length > 0 && (
                        <Badge variant="filled" color="cyan" size="sm">
                            {dropboxConversions.length} Dropbox converti
                            {dropboxConversions.length > 1 ? 's' : ''}
                        </Badge>
                    )}
                    {hasPostsWithImages && (
                        <Badge variant="filled" color="orange" size="sm">
                            {postsWithImages.length} avec image existante
                        </Badge>
                    )}
                </Group>

                {/* Zone de texte pour les URLs */}
                <Stack gap="xs">
                    <Text size="sm" fw={500}>
                        URLs des images (une par ligne) :
                    </Text>
                    <Textarea
                        placeholder={`Collez ici ${selectedCount} URL${selectedCount > 1 ? 's' : ''} d'images, une par ligne...

Exemples :
https://example.com/image1.jpg
https://example.com/image2.png
https://www.dropbox.com/scl/fi/xxx/image.jpg?dl=0
https://example.com/image3.webp`}
                        value={imageUrls}
                        onChange={(e) => setImageUrls(e.target.value)}
                        minRows={4}
                        maxRows={8}
                        autosize
                    />

                    {/* Compteur et aide */}
                    <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                            {parsedUrls.length} URL{parsedUrls.length > 1 ? 's' : ''} détectée
                            {parsedUrls.length > 1 ? 's' : ''}
                        </Text>
                        <Tooltip label="Les formats supportés sont : JPG, JPEG, PNG, GIF, WebP, SVG. Les liens Dropbox sont automatiquement convertis pour le téléchargement direct.">
                            <Group gap={4}>
                                <LuInfo size={14} />
                                <Text size="xs" c="dimmed">
                                    Formats supportés
                                </Text>
                            </Group>
                        </Tooltip>
                    </Group>
                </Stack>

                {/* Alertes de validation */}
                {urlsShortage > 0 && (
                    <Alert icon={<LuAccessibility size={16} />} color="yellow" variant="light">
                        <Text size="sm">
                            Il manque <strong>{urlsShortage}</strong> image
                            {urlsShortage > 1 ? 's' : ''} pour couvrir tous les posts sélectionnés.
                            Les posts sans image correspondante garderont leur image actuelle.
                        </Text>
                    </Alert>
                )}

                {/* Alerte pour les posts avec images existantes */}
                {shouldShowOverwriteWarning && (
                    <Alert icon={<LuAccessibility size={16} />} color="orange" variant="light">
                        <Text size="sm" fw={500} mb="xs">
                            ⚠️ Attention : Posts avec images existantes
                        </Text>
                        <Text size="sm" mb="sm">
                            <strong>{postsWithImages.length}</strong> post
                            {postsWithImages.length > 1 ? 's' : ''}
                            sélectionné{postsWithImages.length > 1 ? 's' : ''} ont déjà une image.
                            Avec les paramètres actuels, ces posts <strong>ne recevront pas</strong>{' '}
                            de nouvelle image.
                        </Text>
                        <Text size="xs" c="orange.7">
                            Cochez "Écraser les images existantes" si vous souhaitez remplacer leurs
                            images actuelles.
                        </Text>
                    </Alert>
                )}

                {urlsExcess > 0 && (
                    <Alert icon={<LuInfo size={16} />} color="blue" variant="light">
                        <Text size="sm">
                            Vous avez <strong>{urlsExcess}</strong> image{urlsExcess > 1 ? 's' : ''}{' '}
                            en trop. Seules les {selectedCount} premières seront utilisées.
                        </Text>
                    </Alert>
                )}

                {/* Alerte pour les conversions Dropbox */}
                {dropboxConversions.length > 0 && (
                    <Alert icon={<LuInfo size={16} />} color="cyan" variant="light">
                        <Text size="sm" fw={500} mb="xs">
                            📁 Liens Dropbox convertis automatiquement :
                        </Text>
                        <Stack gap={2}>
                            {dropboxConversions.slice(0, 3).map((url, index) => (
                                <Text key={index} size="xs" c="cyan.7" ff="monospace">
                                    • {url.length > 60 ? url.substring(0, 60) + '...' : url}
                                </Text>
                            ))}
                            {dropboxConversions.length > 3 && (
                                <Text size="xs" c="cyan.7">
                                    ... et {dropboxConversions.length - 3} autre
                                    {dropboxConversions.length - 3 > 1 ? 's' : ''}
                                </Text>
                            )}
                        </Stack>
                        <Text size="xs" c="cyan.7" mt="xs">
                            Ces liens ont été automatiquement modifiés avec "dl=1" pour permettre le
                            téléchargement direct.
                        </Text>
                    </Alert>
                )}

                {invalidUrls.length > 0 && (
                    <Alert icon={<LuX size={16} />} color="red" variant="light">
                        <Text size="sm" fw={500} mb="xs">
                            URLs invalides détectées :
                        </Text>
                        <Stack gap={2}>
                            {invalidUrls.slice(0, 3).map((url, index) => (
                                <Text key={index} size="xs" c="red.7" ff="monospace">
                                    • {url.length > 60 ? url.substring(0, 60) + '...' : url}
                                </Text>
                            ))}
                            {invalidUrls.length > 3 && (
                                <Text size="xs" c="red.7">
                                    ... et {invalidUrls.length - 3} autre
                                    {invalidUrls.length - 3 > 1 ? 's' : ''}
                                </Text>
                            )}
                        </Stack>
                    </Alert>
                )}

                {/* Option pour écraser les images existantes */}
                <Checkbox
                    checked={overwriteExisting}
                    onChange={(event) => setOverwriteExisting(event.currentTarget.checked)}
                    label="Écraser les images existantes"
                    description="Si décoché, seuls les posts sans image recevront une nouvelle image"
                    size="sm"
                />

                {/* Actions */}
                <Group justify="space-between">
                    <Group gap="xs">
                        <Button
                            variant="light"
                            color="gray"
                            size="sm"
                            onClick={handleClear}
                            disabled={!imageUrls.trim()}
                        >
                            Effacer
                        </Button>
                        <Button variant="light" color="gray" size="sm" onClick={onClose}>
                            Annuler
                        </Button>
                    </Group>

                    <Button
                        leftSection={<LuCheck size={16} />}
                        onClick={handleApply}
                        size="sm"
                        disabled={validUrls.length === 0}
                        color="orange"
                    >
                        Attribuer les images ({validUrls.length})
                    </Button>
                </Group>

                {/* Aperçu de la répartition */}
                {validUrls.length > 0 && (
                    <Alert icon={<LuInfo size={16} />} color="green" variant="light">
                        <Text size="sm">
                            <strong>Répartition :</strong>{' '}
                            {Math.min(validUrls.length, selectedCount)} post
                            {Math.min(validUrls.length, selectedCount) > 1 ? 's' : ''}
                            recevr{Math.min(validUrls.length, selectedCount) > 1 ? 'ont' : 'a'} une
                            nouvelle image.
                            {urlsShortage > 0 && (
                                <>
                                    {' '}
                                    {urlsShortage} post{urlsShortage > 1 ? 's' : ''} garder
                                    {urlsShortage > 1 ? 'ont' : 'a'} leur image actuelle.
                                </>
                            )}
                        </Text>
                    </Alert>
                )}
            </Stack>
        </Card>
    )
}
