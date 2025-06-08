import { SharedProps } from '@adonisjs/inertia/types'
import { Link } from '@inertiajs/react'
import {
    AppShell,
    AppShellHeader,
    AppShellMain,
    AppShellNavbar,
    Box,
    Burger,
    Button,
    Group,
    Image,
    MantineProvider,
    Text,
    ThemeIcon,
    UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { PropsWithChildren } from 'react'
import { LuLayoutDashboard, LuLogOut, LuNewspaper } from 'react-icons/lu'
import classes from './app-layout.module.css'

export default function AppLayout(props: PropsWithChildren<SharedProps>) {
    const [opened, { toggle }] = useDisclosure()

    return (
        <MantineProvider>
            <AppShell
                header={{ height: 60 }}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: { desktop: !opened, mobile: !opened },
                }}
                padding="md"
            >
                <AppShellHeader>
                    <Group h="100%" justify="space-between">
                        <Group pl="md">
                            <Burger opened={opened} onClick={toggle} size="sm" />
                            <Image src="logo.png" alt="Logo" height={40} />
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
                        <Button
                            mt="auto"
                            leftSection={<LuLogOut size={14} />}
                            component={Link}
                            href="/logout"
                            method="post"
                            variant="light"
                        >
                            {`Se déconnecter`}
                        </Button>
                    )}
                </AppShellNavbar>
                <AppShellMain className={classes.main}>{props.children}</AppShellMain>
            </AppShell>
        </MantineProvider>
    )
}
