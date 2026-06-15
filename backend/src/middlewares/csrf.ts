import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import ForbiddenError from '../errors/forbidden-error'

const CSRF_COOKIE_NAME = '_csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
const CSRF_EXCLUDED_PATHS = ['/auth/login', '/auth/register']

const csrfCookieOptions = {
    httpOnly: false,
    sameSite: 'lax' as const,
    secure: false,
    path: '/',
}

export const getCsrfToken = (_req: Request, res: Response) => {
    const token = crypto.randomBytes(32).toString('hex')

    res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions)
    res.status(200).json({ csrfToken: token })
}

export const csrfProtection = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (
        SAFE_METHODS.includes(req.method) ||
        CSRF_EXCLUDED_PATHS.includes(req.path)
    ) {
        return next()
    }

    const tokenFromCookie = req.cookies[CSRF_COOKIE_NAME]
    const tokenFromHeader = req.headers[CSRF_HEADER_NAME]

    if (
        !tokenFromCookie ||
        !tokenFromHeader ||
        tokenFromCookie !== tokenFromHeader
    ) {
        return next(new ForbiddenError('Невалидный CSRF-токен'))
    }

    return next()
}
