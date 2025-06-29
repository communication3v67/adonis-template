import { Box, Button, Flex, Group, Title, Tooltip } from '@mantine/core'
import { LuDownload, LuPlus, LuReplace, LuSend } from 'react-icons/lu'
import { CurrentUser, GmbPost } from '../../types'

interface PageHeaderProps {
    currentUser: CurrentUser
    postsToGenerateCount: number
    postsToGenerate: GmbPost[] // Ajout des posts pour vérification
    sendingToN8n: boolean
    onSendToN8n: () => void
    onCreatePost: () => void
    onExport: () => void
    onSearchReplace?: () => void
    testErrorNotification?: () => void // DEBUG - fonction de test
}

export const PageHeader = ({
    currentUser,
    postsToGenerateCount,
    postsToGenerate,
    sendingToN8n,
    onSendToN8n,
    onCreatePost,
    onExport,
    onSearchReplace,
}: PageHeaderProps) => {
    // Vérifier les conditions pour l'envoi global
    const hasNotionId = !!currentUser.notion_id
    const hasPostsToGenerate = postsToGenerateCount > 0

    // Vérifier combien de posts ont tous les champs requis
    const postsWithRequiredFields = postsToGenerate.filter(
        (post) => post.status === 'Post à générer' && post.text && post.keyword
    )
    const validPostsCount = postsWithRequiredFields.length
    const hasValidPosts = validPostsCount > 0

    // Bouton désactivé si pas de notion_id, pas de posts ou pas de posts valides
    const isN8nButtonDisabled =
        !hasNotionId || !hasPostsToGenerate || !hasValidPosts || sendingToN8n

    // Message du tooltip selon l'état
    const getN8nTooltipMessage = () => {
        if (!hasNotionId) {
            return 'Votre compte doit être lié à Notion pour envoyer des posts'
        }
        if (!hasPostsToGenerate) {
            return 'Aucun post "Post à générer" disponible'
        }
        if (!hasValidPosts) {
            const missingFieldsPosts = postsToGenerateCount - validPostsCount
            return `${missingFieldsPosts} post(s) ont des champs manquants (texte ou mot-clé)`
        }
        if (sendingToN8n) {
            return 'Envoi en cours...'
        }
        if (validPostsCount < postsToGenerateCount) {
            const invalidCount = postsToGenerateCount - validPostsCount
            return `Envoyer ${validPostsCount} post(s) valide(s) (${invalidCount} ignoré(s) - champs manquants)`
        }
        return `Envoyer ${validPostsCount} post(s) vers n8n`
    }

    return (
        <Flex justify="space-between" align="center">
            <Box>
                <Title order={2}>Posts GMB</Title>
            </Box>
            <Group>
                {/* Bouton pour envoyer les posts vers n8n - toujours visible */}
                <Tooltip label={getN8nTooltipMessage()}>
                    <Button
                        variant={isN8nButtonDisabled ? 'subtle' : 'filled'}
                        color={isN8nButtonDisabled ? 'gray' : 'blue'}
                        onClick={() => !isN8nButtonDisabled && onSendToN8n()}
                        loading={sendingToN8n}
                        disabled={isN8nButtonDisabled}
                        leftSection={<LuSend size={16} />}
                        style={{
                            opacity: isN8nButtonDisabled && !sendingToN8n ? 0.6 : 1,
                            cursor: isN8nButtonDisabled ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {sendingToN8n
                            ? 'Envoi en cours...'
                            : hasValidPosts && validPostsCount < postsToGenerateCount
                              ? `Envoyer vers n8n (${validPostsCount}/${postsToGenerateCount})`
                              : hasValidPosts
                                ? `Envoyer vers n8n (${validPostsCount})`
                                : 'Envoyer vers n8n (0)'}
                    </Button>
                </Tooltip>

                <Button onClick={onExport} variant="light" leftSection={<LuDownload size={16} />}>
                    Exporter
                </Button>

                {onSearchReplace && (
                    <Button
                        onClick={onSearchReplace}
                        variant="light"
                        leftSection={<LuReplace size={16} />}
                    >
                        Rechercher/Remplacer
                    </Button>
                )}

                <Button onClick={onCreatePost} leftSection={<LuPlus size={16} />}>
                    Nouveau post
                </Button>
            </Group>
        </Flex>
    )
}
