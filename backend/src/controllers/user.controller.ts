import type { Context } from 'hono'
import { getCookie, deleteCookie } from 'hono/cookie'
import type { AppEnv } from '../types/hono.js'
import { userService } from '../services/user.service.js'

type C = Context<AppEnv>

const REFRESH_COOKIE = 'refreshToken'

export const userController = {
  /**
   * DELETE /api/me — désactive le compte courant (RGPD). On supprime le cookie
   * de refresh côté client puis on renvoie 204.
   */
  async deleteMe(c: C) {
    const userId = (c.get('jwtPayload') as { sub: string }).sub
    const refreshToken = getCookie(c, REFRESH_COOKIE)
    await userService.deactivateAccount(userId, refreshToken)
    deleteCookie(c, REFRESH_COOKIE, { path: '/' })
    return c.body(null, 204)
  },

  /**
   * GET /api/me/export — télécharge l'ensemble des données du compte en JSON.
   */
  async exportMe(c: C) {
    const userId = (c.get('jwtPayload') as { sub: string }).sub
    const data = await userService.exportUserData(userId)
    return c.body(JSON.stringify(data, null, 2), 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lumina-mes-donnees.json"',
    })
  },
}
