import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    const rootDir = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        const filePath = path.resolve(rootDir, `.${req.path}`)

        if (!filePath.startsWith(`${rootDir}${path.sep}`)) {
            return next()
        }

        fs.access(filePath, fs.constants.F_OK, (accessError) => {
            if (accessError) {
                return next()
            }

            return res.sendFile(filePath, (sendFileError) => {
                if (sendFileError) {
                    next(sendFileError)
                }
            })
        })
    }
}
