import { Button, Code, Group, Modal, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { LuX } from 'react-icons/lu'

interface WebhookModalProps {
    opened: boolean
    response: any
    onClose: () => void
}

export const WebhookModal = ({ opened, response, onClose }: WebhookModalProps) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Title order={4}>Réponse du webhook n8n</Title>}
            size="lg"
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Voici la réponse reçue du webhook n8n :
                </Text>

                <ScrollArea h={400}>
                    <Code block>
                        {JSON.stringify(response, null, 2)}
                    </Code>
                </ScrollArea>

                <Group justify="flex-end">
                    <Button onClick={onClose} leftSection={<LuX size={16} />}>
                        Fermer
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
