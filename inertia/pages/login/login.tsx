import { Head, useForm } from '@inertiajs/react'
import { Button, Checkbox, PasswordInput, TextInput } from '@mantine/core'

export default function Login() {
    const form = useForm({
        identifier: '',
        password: '',
        rememberMe: false,
    })

    return (
        <>
            <Head title="Login" />

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    form.post('/login')
                }}
            >
                <TextInput
                    autoFocus
                    label="Identifiant (email ou pseudo)"
                    placeholder="j.dupont ou j.dupont@mail.fr"
                    size="md"
                    error={form.errors.identifier}
                    value={form.data.identifier}
                    onChange={(event) => form.setData('identifier', event.currentTarget.value)}
                />
                <PasswordInput
                    label="Mot de passe"
                    placeholder="Mot de passe"
                    mt="md"
                    size="md"
                    error={form.errors.password}
                    value={form.data.password}
                    onChange={(event) => form.setData('password', event.currentTarget.value)}
                />
                <Checkbox label="Se souvenir de moi" mt="xl" size="md" />
                <Button fullWidth mt="xl" size="md" type="submit">
                    {`Connexion`}
                </Button>
            </form>
        </>
    )
}
