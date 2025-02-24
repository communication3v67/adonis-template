import User from '#models/user'
import { BaseModelDto } from '@adocasts.com/dto/base'

export default class UserDto extends BaseModelDto {
    declare id: number
    declare username: string
    declare email: string
    declare avatar: string | null
    declare createdAt: string
    declare updatedAt: string | null

    constructor(user?: User) {
        super()

        if (!user) return
        this.id = user.id
        this.username = user.username
        this.email = user.email
        this.avatar = user.avatar
        this.createdAt = user.createdAt.toISO()!
        this.updatedAt = user.updatedAt?.toISO()!
    }
}
