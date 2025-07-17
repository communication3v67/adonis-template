import { SharedProps } from '@adonisjs/inertia/types'
import { Link } from '@inertiajs/react'
import {
    AppShell,
    AppShellHeader,
    AppShellMain,
    AppShellNavbar,
    Avatar,
    Box,
    Burger,
    Button,
    Group,
    Image,
    MantineProvider,
    Stack,
    Text,
    ThemeIcon,
    UnstyledButton,
} from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { PropsWithChildren } from 'react'
import { LuLayoutDashboard, LuLogOut, LuNewspaper } from 'react-icons/lu'
import classes from './app-layout.module.css'

// Fonction pour générer les initiales
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
}

export default function AppLayout(
    props: PropsWithChildren<SharedProps & { sidebarOpened?: boolean }>
) {
    // Utiliser directement useLocalStorage pour gérer l'état
    const [opened, setOpened] = useLocalStorage({
        key: 'sidebar-opened',
        defaultValue: props.sidebarOpened ?? false,
    })

    const toggle = () => setOpened(!opened)

    return (
        <MantineProvider>
            <AppShell
                header={{ height: 60 }}
                navbar={{
                    width: 250,
                    breakpoint: 'sm',
                    collapsed: { desktop: !opened, mobile: !opened },
                }}
                padding={{ base: 16, sm: 16 }}
            >
                <AppShellHeader>
                    <Group h="100%">
                        <Group pl="md">
                            <Burger opened={opened} onClick={toggle} size="sm" />
                            <Image src="gmb-logo.png" alt="Logo" height={25} />
                            <Text fw="bold" fz="h4">
                                {import.meta.env.VITE_APP_NAME}
                            </Text>
                        </Group>
                    </Group>
                </AppShellHeader>
                <AppShellNavbar p="md">
                    <UnstyledButton className={classes.navItem} component={Link} href="/">
                        <Group justify="space-between" gap={0}>
                            <Box style={{ display: 'flex', alignItems: 'center' }}>
                                <ThemeIcon variant="light" size={30}>
                                    <LuLayoutDashboard size={18} />
                                </ThemeIcon>
                                <Box ml="md">{`Tableau de bord`}</Box>
                            </Box>
                        </Group>
                    </UnstyledButton>
                    <UnstyledButton className={classes.navItem} component={Link} href="/gmb-posts">
                        <Group justify="space-between" gap={0}>
                            <Box style={{ display: 'flex', alignItems: 'center' }}>
                                <ThemeIcon variant="light" size={30}>
                                    <LuNewspaper size={18} />
                                </ThemeIcon>
                                <Box ml="md">{`Mes posts`}</Box>
                            </Box>
                        </Group>
                    </UnstyledButton>
                    {props.user && (
                        <Stack gap="sm" mt="auto">
                            <Box p="sm" style={{ borderTop: '1px solid #e9ecef' }}>
                                <Group gap="sm">
                                    {props.user.avatar ? (
                                        <Avatar src={props.user.avatar} alt={props.user.username} size={32} />
                                    ) : (
                                        <Avatar size={32} color="blue">
                                            <Text size="xs" fw={500}>
                                                {getInitials(props.user.username)}
                                            </Text>
                                        </Avatar>
                                    )}
                                    <Box style={{ flex: 1 }}>
                                        <Text size="sm" fw={500} truncate>
                                            {props.user.username}
                                        </Text>
                                        <Text size="xs" c="dimmed" truncate>
                                            {props.user.email}
                                        </Text>
                                    </Box>
                                </Group>
                            </Box>
                            <Button
                                leftSection={<LuLogOut size={14} />}
                                component={Link}
                                href="/logout"
                                method="post"
                                variant="light"
                                fullWidth
                            >
                                {`Se déconnecter`}
                            </Button>
                        </Stack>
                    )}
                </AppShellNavbar>
                <AppShellMain className={classes.main}>{props.children}</AppShellMain>
            </AppShell>
        </MantineProvider>
    )
}
