import { Box, Button, Flex, Group, Title } from '@mantine/core'
import { Link } from '@inertiajs/react'
import { LuDownload, LuPlus, LuSend } from 'react-icons/lu'
import { CurrentUser } from '../../types'

interface PageHeaderProps {
    currentUser: CurrentUser
    postsToGenerateCount: number
    sendingToN8n: boolean
    onSendToN8n: () => void
    testErrorNotification?: () => void // DEBUG - fonction de test
}

export const PageHeader = ({
    currentUser,
    postsToGenerateCount,
    sendingToN8n,
    onSendToN8n,
}: PageHeaderProps) => {
    // Debug temporaire
    console.log('=== PAGEHEADER DEBUG ===')
    console.log('postsToGenerateCount:', postsToGenerateCount)
    console.log('currentUser.notion_id:', currentUser.notion_id)
    console.log('sendingToN8n:', sendingToN8n)
    console.log('Conditions pour afficher bouton:')
    console.log('- postsToGenerateCount > 0:', postsToGenerateCount > 0)
    console.log('- currentUser.notion_id exists:', !!currentUser.notion_id)
    console.log('========================')

    return (
        <Flex justify="space-between" align="center">
            <Box>
                <Title order={2}>Posts GMB</Title>
            </Box>
            <Group>
                {/* Bouton pour envoyer les posts vers n8n */}
                {postsToGenerateCount > 0 && currentUser.notion_id && (
                    <Button
                        variant="filled"
                        onClick={onSendToN8n}
                        loading={sendingToN8n}
                        disabled={sendingToN8n}
                        leftSection={<LuSend size={16} />}
                    >
                        {sendingToN8n
                            ? 'Envoi en cours...'
                            : `Envoyer vers n8n (${postsToGenerateCount})`}
                    </Button>
                )}

                <Button
                    component={Link}
                    href="/gmb-posts/export"
                    variant="light"
                    leftSection={<LuDownload size={16} />}
                >
                    Exporter
                </Button>
                
                <Button
                    component={Link}
                    href="/gmb-posts/create"
                    leftSection={<LuPlus size={16} />}
                >
                    Nouveau post
                </Button>
            </Group>
        </Flex>
    )
}
